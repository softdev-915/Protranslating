// Backup Audit and Notifications
// ==============================
// 1. Create an adhoc that backups really efficiently following an efficient algo that we will never use again but that works with the database as is for backup purposes.
// 2. Change the UI to allow restoring data 1 month at a time only
// 3. Leave the scheduler code as is because most likely it will run efficiently for what is expected: backing up 1 month at a time.
const _ = require('lodash');
const Promise = require('bluebird');
const moment = require('moment');
const winston = require('winston');
const GCStorage = require('@google-cloud/storage');
const tar = require('tar-stream');
const getenv = require('getenv');
const backup = require('mongodb-backup-stream-4x');

// Audit envs
const LMS_BACKUP_AUDIT_CONNECTION_STRING = getenv('LMS_BACKUP_AUDIT_CONNECTION_STRING');
const LMS_BACKUP_AUDIT_COLLECTIONS = getenv('LMS_BACKUP_AUDIT_COLLECTIONS');
const LMS_BACKUP_AUDIT_PREFIX = getenv('LMS_BACKUP_AUDIT_PREFIX');
const AUDIT_COLLECTION = LMS_BACKUP_AUDIT_COLLECTIONS.split(',') || ['audit_trails'];
const AUDIT_ATTRIBUTE = 'timestamp';

// Notification Envs
const LMS_BACKUP_NOTIFICATION_CONNECTION_STRING = getenv('LMS_BACKUP_NOTIFICATION_CONNECTION_STRING');
const LMS_BACKUP_NOTIFICATION_COLLECTIONS = getenv('LMS_BACKUP_NOTIFICATION_COLLECTIONS');
const LMS_BACKUP_NOTIFICATION_PREFIX = getenv('LMS_BACKUP_NOTIFICATION_PREFIX');
const NOTIFICATION_COLLECTION = LMS_BACKUP_NOTIFICATION_COLLECTIONS.split(',') || ['notifications'];
const NOTIFICATION_ATTRIBUTE = 'createdAt';

// Initialize bucket
const gcs = GCStorage({
  keyFilename: process.env.GCS_KEY_FILE,
});
const gcsBucket = gcs.bucket(process.env.GCS_BUCKET);
const GCS_DELAY = 5 * 1000;

// DBs connections
let auditDb;
let lmsDb;
const DBs = {
  'audit': null,
  'notification': null,
};

const generateDates = (limit = 3) => {
  // 1st day of each of each of the previous months
  const dates = [];
  const prevDate = moment()
    .startOf('month')
    .add(-1, 'month')
    .endOf('day');
  for (let i = 0; i < limit; i++) {
    // NOTE: generate real month number, e.g. Feb => 2
    dates.push({ month: prevDate.month() + 1, year: prevDate.year() });
    prevDate.add(-1, 'month');
  }
  return dates;
};

// NOTE: curated list after $year, $month mongoDB aggreagation uses this method
const getMonthDateRange = (year, month) => {
  // month in moment is 0 based, so 11 is actually december, subtract 1 to compensate
  // NOTE: Aditionally we always want an entire month, so we get last month from the begginning
  // to the end
  const startDate = moment([year, month - 1]);

  // Clone the value before .endOf()
  const endDate = moment(startDate).endOf('month');

  return {
    start: startDate.toDate(),
    end: endDate.toDate(),
  };
};

const getBackupQueryFromPeriod = (attribute, config) => {
  const params = ['year', 'month'];
  params.forEach((p) => {
    if (!_.has(config, p)) {
      throw new Error('Invalid period configation received');
    }
  });
  const period = getMonthDateRange(config.year, config.month);
  const query = {};
  query[attribute] = { $gte: period.start, $lte: period.end };
  return query;
};

const listCloudBackups = (basePath, nameOnly = false) => {
  const fullList = [];
  // NOTE: e.g. /pts-lms-test-files/backup-audit-files/cloud/%lsp_id%/dump-y2018-m01.tar
  // when listing from bucket do not include the root /, search.replace(/^\//, '')
  if (!_.isString(basePath) && basePath !== '') {
    throw new Error('Unable to list cloud backups, basePath is not a valid string');
  }
  return new Promise((resolve, reject) => {
    gcsBucket.getFiles({ prefix: basePath.replace(/^\//, '') })
      .then((results) => {
        const files = _.get(results, '[0]', []);
        const fileNames = files
          .filter(f => (typeof f.name === 'string' && f.name.match(/.*.tar$/)))
          .map(f => f.name);
        if (nameOnly) {
          return resolve(fileNames);
        }
        fileNames.forEach((fName) => {
          let endingSubStr = fName.match(/\d{4}-\d{1,2}.tar$/);
          endingSubStr = _.get(endingSubStr, '[0]', false);
          if (endingSubStr) {
            const year = endingSubStr.replace(/-.*/, '');
            const month = endingSubStr.replace(/\d{4}-/, '').replace(/.tar$/, '');
            fullList.push({ year: year, month: month });
          }
        });

        return resolve(fullList);
      }).catch(reject);
  });
}

const findCloudBackup = (basePath, name) => {
  return new Promise((resolve, reject) => {
    listCloudBackups(basePath, true).then((list) => {
      if (list.indexOf(`${basePath}${name}`)) {
        resolve(true);
      } else {
        resolve(false);
      }
    }).catch(e => reject(e));
  });
};

const checkIfTarExist = (period, destPrefix) => {
  const destPath = `${destPrefix.replace(/\/$/, '')}/backup-${period.year}-${period.month}.tar`;
  logger.info(`${period.year}-${period.month}: searching ${destPath}`);
  // Save tar also into GCS
  const destFile = gcsBucket.file(destPath);
  return destFile.exists()
    .then(response => {
      const exist = _.get(response, '[0]');
      logger.info(`${period.year}-${period.month}: searching ${destPath} exists? ${exist}`);
      if (!_.isBoolean(exist)) {
        throw new Error('Exist flag expected to be boolean');
        return;
      }
      return exist;
    });
};

const gcsMoveTarFile = (originKey, destinationKey) => {
  return new Promise((resolveMoveErrored, rejectMoveErrored) => {
    const gcOriginFile = gcsBucket.file(originKey);
    const gcDestinationFile = gcsBucket.file(destinationKey);
    const writeStream = gcDestinationFile.createWriteStream();
    const readStream = gcOriginFile.createReadStream();
    readStream.pipe(writeStream);
    writeStream.on('finish', resolveMoveErrored);
    writeStream.on('error', rejectMoveErrored);
  })
  .then(() => gcsBucket.file(originKey).delete());
};

const countEntriesInTarFile = (tarReadStream, fileRegExp) => {
  let total = 0;
  const extract = tar.extract();
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line prefer-arrow-callback
    extract.on('entry', function (header, stream, next) {
      // header is the tar header
      // stream is the content body (might be an empty stream)
      // call next when you are done with this entry
      const entryName = _.get(header, 'name', '');

      if (_.isString(entryName) && entryName.match(fileRegExp)) {
        total++;
      }

      // eslint-disable-next-line prefer-arrow-callback
      stream.on('end', function () {
        // ready for next entry
        next();
      });

      // just auto drain the stream
      stream.resume();
    });

    // eslint-disable-next-line prefer-arrow-callback
    extract.on('finish', function () {
      // all entries read
      resolve(total);
    });

    // eslint-disable-next-line prefer-arrow-callback
    extract.on('error', function (err) {
      // all entries read
      reject(err);
    });

    tarReadStream.pipe(extract);
  });
};

const doCleanUp = (period, COL = 'audit') => {
  const COL_NAME = COL === 'audit' ? AUDIT_COLLECTION[0] : NOTIFICATION_COLLECTION[0];
  const ATTR_NAME = COL === 'audit' ? AUDIT_ATTRIBUTE : NOTIFICATION_ATTRIBUTE;
  const query = getBackupQueryFromPeriod(ATTR_NAME, period);
  return new Promise((resolve, reject) => {
    DBs[COL].collection(COL_NAME).remove(query, (err, numberOfRemovedDocs) => {
      if (err) {
        logger.info(`${period.year}-${period.month}: clean up failed: ${err}`);
        reject(err);
      } else {
        const result = (typeof numberOfRemovedDocs.result !== 'undefined') ?
          numberOfRemovedDocs.result : numberOfRemovedDocs;
        logger.info(`${period.year}-${period.month}: clean up SUCCESS: removed docs after backup`, result);
        resolve(numberOfRemovedDocs);
      }
    });
  });
};

const countDocs = (period, COL = 'audit') => {
  const COL_NAME = COL === 'audit' ? AUDIT_COLLECTION[0] : NOTIFICATION_COLLECTION[0];
  const ATTR_NAME = COL === 'audit' ? AUDIT_ATTRIBUTE : NOTIFICATION_ATTRIBUTE;
  const query = getBackupQueryFromPeriod(ATTR_NAME, period);
  return new Promise((resolve, reject) => {
    DBs[COL].collection(COL_NAME).find(query).count((err, numberOfDocs) => {
      if (err) {
        this.logger.error(`Backup: count docs: ${this.schedulerName} unable to count docs`);
        reject(err);
      } else {
        resolve(numberOfDocs);
      }
    });
  });
};

const formatConnectionString = (uriString) => {
  // eslint-disable-next-line no-useless-escape
  const matches = uriString.replace('mongodb://', '').match(/^([^:\/\?,]+):([^@\/\?,]+)@(.*)$/);

  if (matches !== null) {
    const search = `${matches[1]}:${matches[2]}`;
    const user = encodeURIComponent(matches[1]);
    const pass = encodeURIComponent(matches[2]);
    const credentials = `${user}:${pass}`;
    return uriString.replace(search, credentials);
  }

  return uriString;
};

const doSanityCheck = (period, tarKey, COL, docsExpected) => {
  return new Promise((resolve, reject) => {
    Promise.resolve()
      .then(() => {
        const gcTempFile = gcsBucket.file(tarKey);
        const tarStream = gcTempFile.createReadStream();
        return countEntriesInTarFile(tarStream, /.*.bson$/);
      })
      .then((totalDocs) => {
        // Check number of docs
        logger.info(`${period.year}-${period.month}: counting ${totalDocs} of ${docsExpected} expected in ${tarKey}`);
        if (totalDocs !== docsExpected) {
          resolve(false);
        } else {
          resolve(true);
        }
      })
      .catch(reject);
  });
};

const doBackup = (period, destPrefix, COL, docsExpected) => {
  const finalCloudKey = `${destPrefix.replace(/\/$/, '')}/backup-${period.year}-${period.month}.tar`;
  const tempTarKey = `${finalCloudKey}-${Date.now()}-temp`;

  const COL_NAME = COL === 'audit' ? AUDIT_COLLECTION[0] : NOTIFICATION_COLLECTION[0];
  const ATTR_NAME = COL === 'audit' ? AUDIT_ATTRIBUTE : NOTIFICATION_ATTRIBUTE;
  const query = getBackupQueryFromPeriod(ATTR_NAME, period);

  const connectionStr = COL === 'audit' ? LMS_BACKUP_AUDIT_CONNECTION_STRING : LMS_BACKUP_NOTIFICATION_CONNECTION_STRING;
  const dbCollections = COL === 'audit' ? AUDIT_COLLECTION : NOTIFICATION_COLLECTION;

  return new Promise((resolve, reject) => {
    const gcFile = gcsBucket.file(tempTarKey);
    const cloudDestination = gcFile.createWriteStream();

    backup({
      uri: formatConnectionString(connectionStr),
      collections: dbCollections,
      query: query,
      stream: cloudDestination,
      callback: (err) => {
        // logger.info(`${period.year}-${period.month}: temp backup finished`);
        if (err) {
          logger.info(`${period.year}-${period.month}: temp backup errored ${tempTarKey} ${err}`);
          reject(err);
        } else {
          logger.info(`${period.year}-${period.month}: temp backup success ${tempTarKey}`);
          // give some seconds to GCS api to update
          Promise.delay(GCS_DELAY)
            .then(() => {
              const gcTempFile = gcsBucket.file(tempTarKey);
              const tarStream = gcTempFile.createReadStream();
              return countEntriesInTarFile(tarStream, /.*.bson$/);
            })
            .then((totalDocs) => {
              // Check number of docs before moving
              // logger.info(`${period.year}-${period.month}: Counting ${totalDocs} of ${docsExpected} expected in ${tempTarKey}`);
              if (totalDocs !== docsExpected) {
                logger.info(`${period.year}-${period.month}: count failed ${totalDocs} of ${docsExpected} expected in ${tempTarKey}`);
                reject(new Error(`${period.year}-${period.month}: sanity check on temp tar file not passed`));
                return;
              }
              logger.info(`${period.year}-${period.month}: count SUCCESS ${totalDocs} of ${docsExpected} expected in ${tempTarKey}`);
              return totalDocs;
            })
            .then(() => gcsMoveTarFile(tempTarKey, finalCloudKey))
            .then(() => Promise.delay(GCS_DELAY))
            .then(() => {
              const gcFinalFile = gcsBucket.file(finalCloudKey);
              const tarStream = gcFinalFile.createReadStream();
              return countEntriesInTarFile(tarStream, /.*.bson$/);
            })
            .then((totalDocs) => {
              if (totalDocs !== docsExpected) {
                logger.info(`${period.year}-${period.month}: count failed ${totalDocs} of ${docsExpected} expected in ${finalCloudKey}`);
                return gcsMoveTarFile(finalCloudKey, `${finalCloudKey}-errored-temp`)
                  .then(() => reject(new Error(`${period.year}-${period.month}: sanity check on final tar file not passed`)));
              }
              logger.info(`${period.year}-${period.month}: count SUCCESS ${totalDocs} of ${docsExpected} expected in ${finalCloudKey}`);
              return totalDocs;
            })
            .then(() => resolve());
        }
      }
    });

  });
};


const mongo = require('../../app/components/database/mongo');
const configuration = require('../../app/components/configuration');

// eslint-disable-next-line space-unary-ops
const logger = new(winston.Logger)({
  // level: 'silly',
  timestamp: () => moment().utc().toDate(),
  transports: [new (winston.transports.Console)({
    colorize: true,
  })],
});

// logger.log = console.log;

// Scan periods to the past
const nPeriodsToScan = 24;
let executeTasks = [];

// generate date ranges
const periods = generateDates(nPeriodsToScan);
// console.log(periods);

// Check tar file existance
// Count documents in period
//
// |                     | Tar Exists  | Tar Does NOT Exist |
// | Docs in period >  0 | See #2      | See #1             |
// | Docs in period == 0 | Do Nothing  | Do Nothing         |
//
// Case #1
// (ok) Do backup on temp file
// (ok) Perform Sanity Check on temp file
// (ok) Move file to final destination
// (ok) Perform Sanity Check on final destination
// (ok) Remove docs from DB
//
// Case #2
// (ok) Count docs on Tar File and compare with
// (ok) If number of docs doesn't match, move tar to .tar-partial and execute Case #1
// (ok) If number of docs match, the backup is correct
// (ok) Remove docs from DB
//
const generateBackupHandler = (period, COL = 'audit') => {
  if (!COL.match(/(audit|notification)/)) {
    throw new Error('Unable to identifify backup entity');
    return;
  }
  return function() {
    const fileName = `backup-${period.year}-${period.month}.tar`;
    logger.info(`Executing ${period.year}-${period.month} audit`);
    return new Promise((resolve, reject) => {
      const destPrefix = (COL === 'audit') ? LMS_BACKUP_AUDIT_PREFIX : LMS_BACKUP_NOTIFICATION_PREFIX;
      let totalDocs = null;
      let tarExists = null;

      countDocs(period, COL).then((total) => {
        logger.info(`${period.year}-${period.month}: total docs in DB ${total}`);
        if (!_.isNumber(total) || total < 0) {
          throw new Error('Positive number was expected');
        }
        if (total === 0) {
          logger.info(`${period.year}-${period.month}: no documents found in period, skipping...`);
          return resolve();
        }
        totalDocs = total;
        // check if tar file exists

        return checkIfTarExist(period, destPrefix);
      }).then(exists => {
        if (!_.isBoolean(exists)) {
          throw new Error('Boolean was expected');
        }
        tarExists = exists;
        logger.info(`${period.year}-${period.month}: tar file ${exists ? 'Found' : 'Not Found'}`);
        if (!tarExists) {
          // if tar does not exists
          return doBackup(period, destPrefix, COL, totalDocs)
            .then(() => doCleanUp(period, COL))
            .then(() => resolve());
        }
        logger.info(`${period.year}-${period.month}: executing sanity check...`);
        const finalCloudKey = `${destPrefix.replace(/\/$/, '')}/backup-${period.year}-${period.month}.tar`;
        return doSanityCheck(period, finalCloudKey, COL, totalDocs)
          .then((passed) => {
            logger.info(`${period.year}-${period.month}: sanity check ${passed ? 'PASSED' : 'Not Passed'} for ${fileName}`);
            return passed;
          })
          .then((passed) => {
            if (!passed) {
              // If number of docs doesn't match, move tar to .tar-partial and execute Case #1
              const partialTarKey = `${finalCloudKey}-${Date.now()}-partial`;

              return gcsMoveTarFile(finalCloudKey, partialTarKey)
                .then(() => Promise.delay(GCS_DELAY))
                .then(() => doBackup(period, destPrefix, COL, totalDocs))
                .then(() => doCleanUp(period, COL))
                .then(() => resolve());
            }
            // If number of docs match, the backup is correct, then remove docs from DB
            return doCleanUp(period, COL)
              .then(() => resolve());
          })
          .then(() => resolve());
      })
      .catch(reject);
    });
  };
};

// (ok) Scan Tar file in the cloud
// (ok) Count records monthly use find and query (not aggregation)
// (ok) Perform the bakup and delete the records
// (ok) Do the same for notifications


(async () => {
  try {
    await mongo.connect(configuration).then((connections) => {
      logger.info('DB Connected');
      DBs['audit'] = connections.mongoose.connections.find(db => db.name === 'lms_audit');
      DBs['notification'] = connections.mongoose.connection;
    });
    logger.info('Generating tasks for audit');
    executeTasks = periods.map((period) => {
      // Create audit backup task
      return generateBackupHandler(period, 'audit');
    });
    logger.info('Executing audit scans');
    await Promise.mapSeries(executeTasks, f => f());
    logger.info('Generating tasks for notification');
    executeTasks = periods.map((period) => {
      // Create notification backup task
      return generateBackupHandler(period, 'notification');
    });
    logger.info('Executing notification scans');
    await Promise.mapSeries(executeTasks, f => f());
    logger.info('Execution SUCCESS');
    process.exit();

  } catch (e) {
    const msg = _.get(e, 'message', e);
    logger.info('Execution FAILED');
    logger.error(`Backup Script Failure ${e}`);
    throw e;
  }
})();
