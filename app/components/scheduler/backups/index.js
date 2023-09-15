const Promise = require('bluebird');
const _ = require('lodash');
const moment = require('moment');
const tar = require('tar-stream');
const { pipeline } = require('stream');
const { MongoClient } = require('mongodb');
const BSON = require('bson');
const NotificationBackupStrategy = require('./notification-strategy');
const CloudStorage = require('../../cloud-storage');
const logger = require('../../log/logger');
const { validObjectId } = require('../../../utils/schema');
const { monthPeriodQuery } = require('../../../utils/backup');
const tarTransform = require('../../backup/tar-transform');
const { formatConnectionString } = require('../../../utils/url');

const GCS_ASSERTION_TIMEOUT = 120000;
const streamToDocument = (stream) => new Promise((resolve, reject) => {
  const _buf = [];
  stream.on('data', (chunk) => _buf.push(chunk));
  stream.on('end', () => {
    const filledBuffer = Buffer.concat(_buf);
    resolve(BSON.deserialize(filledBuffer));
  });
  stream.on('error', (err) => reject(err));
});

const streamBackupData = async ({ dbPath, readStream, gcsWriteStream }) => {
  try {
    logger.debug('Backup: creating a tarball file from documents');
    return new Promise((resolve, reject) => {
      pipeline(
        readStream,
        tarTransform(dbPath),
        gcsWriteStream,
        (e) => {
          if (e) {
            logger.error(e);
            return reject(e);
          }
          logger.debug('Backup: finished compressing and uploading a period');
          resolve();
        },
      );
    });
  } catch (e) {
    logger.error(e);
    throw e;
  }
};
const restoreFromStream = async ({ db, readStream }) => {
  logger.debug('Started extracting documents');
  return new Promise((resolve, reject) => {
    const extract = tar.extract();
    extract
      .on('entry', async (header, stream, next) => {
        if (header.type !== 'file') return next();
        try {
          const [, , collectionName] = header.name.split('/');
          const document = await streamToDocument(stream);
          const collection = db.collection(collectionName);
          await collection.insertOne(document);
          next();
        } catch (e) {
          reject(e);
        }
      })
      .on('error', (e) => reject(e))
      .on('finish', async () => resolve());
    readStream.pipe(extract);
  });
};

class BackupScheduler {
  constructor(schedulerName, configuration, mock = false) {
    this.mock = _.defaultTo(mock, false);
    this.schedulerName = schedulerName;
    this.logger = logger;
    this.configuration = configuration;
    const { mockParams } = configuration;
    const now = moment().utc();
    if (this.mock && mockParams) {
      this.year = mockParams.year || now.year();
      this.month = mockParams.month || now.month();
    } else {
      this.year = now.year();
      this.month = now.month();
    }
    this.cloudStorage = new CloudStorage(configuration, logger);
  }

  getBackupEntity(lspId) {
    if (this.schedulerName === 'backup-notifications-monthly') {
      return new NotificationBackupStrategy(this.schedulerName, lspId);
    }
    throw new Error(`No backup strategy found for ${this.schedulerName}`);
  }

  getBackupConfig(params) {
    const { lspId } = params;
    const period = _.defaultTo(params.period, {});
    const globalConfig = this.configuration.environment;
    const year = _.defaultTo(period.year, this.year);
    const month = _.defaultTo(period.month, this.month);
    const fileName = `backup-${year}-${month}.tar`;
    if (this.schedulerName === 'backup-notifications-monthly') {
      return {
        lspId,
        connectionString: globalConfig.LMS_BACKUP_NOTIFICATION_CONNECTION_STRING,
        rootPath: `${lspId}/${globalConfig.LMS_BACKUP_NOTIFICATION_PREFIX}`,
        collection: globalConfig.LMS_BACKUP_NOTIFICATION_COLLECTIONS || ['notifications'],
        attribute: 'createdAt',
        cloudKey: `${lspId}/${globalConfig.LMS_BACKUP_NOTIFICATION_PREFIX}/${fileName}`,
      };
    }
    throw new Error(`No Database Defined for this backup ${this.schedulerName}`);
  }

  async listCloudBackups(params) {
    const { lspId } = params;
    const { rootPath } = this.getBackupConfig({ lspId });

    if (!_.isString(rootPath) || _.isEmpty(rootPath)) {
      throw new Error('listCloudBackups: basePath is not a valid string');
    }
    const prefix = rootPath.replace(/^\//, '');
    this.logger.debug(`Listing cloud backups for: ${prefix}`);
    const [files] = await this.cloudStorage.gcsBucket.getFiles({ prefix });
    return files
      .filter((file) => file.name)
      .map((file) => file.name.match(/\d{4}-\d{1,2}\.tar$/))
      .filter((matchArray) => _.isArray(matchArray) && matchArray.length)
      .map((matchArray) => ({
        year: matchArray[0].replace(/-.*/, ''),
        month: matchArray[0]
          .replace(/\d{4}-/, '')
          .replace(/.tar$/, ''),
      }));
  }

  async executeBackupJob({ config, query, docsExpected }) {
    const { cloudKey, collection, connectionString } = config;
    const { gcsWriteStream } = this.cloudStorage.getUploadWriteStream(cloudKey);
    this.logger.debug(`Backup: backing up collection ${JSON.stringify(collection)}`);
    try {
      const uri = formatConnectionString(connectionString);
      const client = await MongoClient.connect(uri);
      const db = client.db();
      const readStream = db.collection(collection).find(query);
      const dbPath = { dbName: db.databaseName, colName: collection };
      this.logger.debug(`Backup: of ${cloudKey}: has started`);
      await streamBackupData({ dbPath, readStream, gcsWriteStream }).catch((e) => { throw e; });
      this.logger.debug(`Backup: finished uploading ${cloudKey}`);
      this.logger.debug(`Trying to assert that ${cloudKey} is in the bucket...`);
      await this.cloudStorage.gcpAssertFileExists(cloudKey, GCS_ASSERTION_TIMEOUT);
      this.logger.debug(`Backup assertion: ${cloudKey} is in the bucket`);
      this.logger.debug(`Removing collection records for the ${cloudKey}...`);
      const { deletedCount } = await db.collection(collection).deleteMany(query);
      this.logger.debug(`Removed ${deletedCount} records in db for ${cloudKey}`);
      readStream.close();
      await client.close();
      if (docsExpected !== deletedCount) {
        throw new Error(`Expected ${docsExpected} but removed ${deletedCount}`);
      }
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   * Beware: Usage in production is forbidden.
   */
  async removePastMonthBackup(params) {
    if (this.configuration.environment.IS_PROD) {
      throw new Error('Must not delete backups in production ever!');
    }
    const { lspId } = params;
    const { rootPath } = this.getBackupConfig({ lspId });
    const pastMonth = moment().utc()
      .startOf('day')
      .subtract(1, 'month')
      .format('YYYY-M');

    if (!_.isString(rootPath) || _.isEmpty(rootPath)) {
      throw new Error('listCloudBackups: basePath is not a valid string');
    }
    const filename = `${rootPath}/backup-${pastMonth}.tar`;
    try {
      await this.cloudStorage.gcsBucket.file(filename).delete();
      this.logger.debug(`${filename} was deleted from cloud bucket`);
    } catch (e) {
      this.logger.debug(`${filename} was not found in the bucket`);
    }
  }

  getAllPeriodsBetweenDates(from, to) {
    const periods = to.diff(from, 'months') + 1;
    return Array.from(
      Array(periods),
      (v, monthsToAdd) => from.clone().add(monthsToAdd, 'months'),
    );
  }

  buildRestoreJob(config) {
    const { db, cloudKey } = config;
    this.logger.debug(`Restore: has started for: ${cloudKey}`);
    return async () => {
      const [files] = await this.cloudStorage.gcsBucket.getFiles({ prefix: cloudKey });
      if (_.isEmpty(files)) {
        this.logger.debug(`Restore: Unable to find backup folder ${cloudKey}`);
        return { status: 'skipped', folder: cloudKey, desc: 'not found' };
      }
      try {
        const gcFile = this.cloudStorage.gcsBucket.file(cloudKey);
        const readStream = gcFile.createReadStream();
        await restoreFromStream({ db, readStream });
        this.logger.debug(`Restore: Successfully restored backup folder ${cloudKey}`);
        return { status: 'success', folder: cloudKey, desc: 'restored' };
      } catch (e) {
        this.logger.error(`Restore: Finish restoring backup folder ${cloudKey}`);
        this.logger.error(`Restore: Status failed for ${cloudKey}`);
        throw e;
      }
    };
  }

  async restoreFrom(fromDate, lspId) {
    if (!fromDate.isValid()) throw new Error('Restore: "fromDate" is not valid');
    const {
      attribute,
      rootPath,
      connectionString,
      collection,
    } = this.getBackupConfig({ lspId });
    const uri = formatConnectionString(connectionString);
    const client = await MongoClient.connect(uri);
    const db = client.db();
    const restorePeriods = this.getAllPeriodsBetweenDates(fromDate, fromDate);
    if (_.isEmpty(restorePeriods)) {
      this.logger.debug('Nothing to restore');
      return [];
    }
    const logs = await Promise.map(restorePeriods, async (period) => {
      const removeQuery = monthPeriodQuery({ date: period, attribute, lspId });
      const backupDate = period.format('YYYY-M');
      const cloudKey = `${rootPath}/backup-${backupDate}.tar`;
      const { deletedCount } = await db.collection(collection).deleteMany(removeQuery);
      this.logger.debug(`Restore: removed ${deletedCount} records for ${backupDate}`);
      const job = this.buildRestoreJob({ db, cloudKey });
      return job();
    }).catch((e) => {
      throw e;
    });
    await client.close();
    this.logger.debug('Restore: All restore jobs are finished');
    return logs.map((log) => ({
      ...log,
      folder: log.folder.replace(rootPath, '.'),
    }));
  }

  async run(job, done) {
    const lspId = _.get(job, 'attrs.data.lspId');
    if (!validObjectId(lspId)) {
      throw new Error(`LspId ${lspId} is invalid`);
    }
    this.logger.debug(`Backup: ${this.schedulerName} is starting`);
    try {
      const scheduler = this.getBackupEntity(lspId);
      const availableBackups = await this.listCloudBackups({ lspId });
      this.logger.debug(`Available backups: ${JSON.stringify(availableBackups)}`);
      const periodsToBackup = await scheduler.getPeriodsToBackup(availableBackups);
      this.logger.debug(`Periods to backup: ${JSON.stringify(periodsToBackup)}`);
      await Promise.mapSeries(periodsToBackup, async (period) => {
        this.logger.debug(`Backing up: ${JSON.stringify(period)}`);
        const config = this.getBackupConfig({ lspId, period });
        const { cloudKey, attribute } = config;
        const { year, month } = period;
        const date = moment().set('year', year).set('month', month - 1);
        const query = monthPeriodQuery({ date, attribute, lspId });
        this.logger.debug(`Query to backup: ${JSON.stringify(query)}`);
        const docsExpected = await scheduler.collection.countDocuments(query);
        this.logger.debug(`Backup: expected ${docsExpected} docs for ${cloudKey}`);
        return this.executeBackupJob({ config, query, docsExpected });
      }).catch((e) => {
        throw e;
      });
      return done();
    } catch (e) {
      this.logger.error(`Backup run(): ${e}`);
      done(e);
    }
  }
}

module.exports = BackupScheduler;
