const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const path = require('path');
const stdoutLogger = require('../log/stdout-logger');
const migrationExecutorFactory = require('./migration-executor-factory');
const migrationReaderFactory = require('./migration-reader-factory');
const { models: mongooseSchema } = require('../database/mongo');
const logger = require('../log/logger');

const migrationFolder = path.join(__dirname, '../../migrations');
const migrationReader = migrationReaderFactory(migrationFolder);
const filenameToMoment = (filename) => path.basename(filename).split('.')[0];
const MIGRATION_EXECUTING_FLAG = 'migration_executing';
const AVAILABILITY_CHECK_INTERVAL_MS = 5000;
const mockJob = { touch: (cb) => cb() };

class MigrationRunner {
  constructor(job) {
    this.job = job || mockJob;
    this.schema = mongooseSchema;
    this.executorFactory = migrationExecutorFactory;
    this.migrationReader = migrationReader;
    this.logger = logger;
    this.areMigrationsRunning = false;
    this.failedMigration = '';
  }

  async lockMigrationRunner() {
    const migrationClusterFlag = await this.setRunningLock({ status: true });
    return _.get(migrationClusterFlag, 'executing', false);
  }

  setRunningLock({
    status = false, hasFailed = false, failedReason = '', lastExecuted,
  }) {
    this.logger.debug(`Setting migration lock to state executing = ${status}`);
    const query = { executing: !status, flag: MIGRATION_EXECUTING_FLAG };
    const update = {
      executing: status, hasFailed, failedReason, lastExecuted,
    };
    try {
      return this.schema.MigrationCluster.findOneAndUpdate(
        query,
        update,
        { new: true },
      );
    } catch (error) {
      this.logger.error(`Process with pid: ${process.pid} failed to lock migrations cluster. Check for migration errors inside lms_migrations_cluster collection ${error}`);
      return null;
    }
  }

  async getLastExecutedMigration() {
    const lastMigrationRecord = await this.schema.Migration.findOne().sort({ name: -1 });
    return _.get(lastMigrationRecord, 'name', null);
  }

  async insertMigrationRunnerFlag() {
    const migrationFlagRecord = {
      flag: MIGRATION_EXECUTING_FLAG,
      executing: false,
      hasFailed: false,
    };
    return this.schema.MigrationCluster.findOneAndUpdateWithDeleted(
      migrationFlagRecord,
      { $set: migrationFlagRecord },
      { upsert: true, new: true },
    );
  }

  async getMigrationRunnerFlag() {
    const migrationFlagInDb = await this.schema.MigrationCluster.findOne({
      flag: MIGRATION_EXECUTING_FLAG,
    });
    if (migrationFlagInDb === null) {
      return this.insertMigrationRunnerFlag();
    }
    return migrationFlagInDb;
  }

  waitForMigrationsFinish() {
    return new Promise((resolve, reject) => {
      const checkIntervalId = setInterval(() => {
        this.logger.info(`Checking if migrations have finished from pid: ${process.pid}`);
        this.getMigrationRunnerFlag().then((status) => {
          const isExecuting = _.get(status, 'executing', false);
          const hasFailed = _.get(status, 'hasFailed', false);
          if (hasFailed) {
            clearInterval(checkIntervalId);
            reject(new Error('Migrations have failed. App will not start'));
          }
          if (!isExecuting) {
            this.logger.info(`Migrations have finished executing from pid: ${process.pid}`);
            return resolve(clearInterval(checkIntervalId));
          }
        });
      }, AVAILABILITY_CHECK_INTERVAL_MS);
    });
  }

  async run() {
    stdoutLogger.debug(`Trying to run migrations from pid: ${process.pid}`);
    stdoutLogger.debug(`Checking migration runner flag from pid: ${process.pid}`);
    const migrationFlag = await this.getMigrationRunnerFlag();
    stdoutLogger.debug(`Migration flag: ${migrationFlag.name} checked from pid: ${process.pid}`);
    try {
      const migrationRunnerStatus = await this.executeMigrations();
      if (_.isNil(migrationRunnerStatus) || migrationRunnerStatus.executing) {
        logger.info('Migrations are being executed...');
        await this.waitForMigrationsFinish();
      }
      if (!_.isNil(migrationRunnerStatus) && migrationRunnerStatus.hasFailed) {
        logger.error('Migrations ended with errors');
        throw new Error(`Migrations have failed ${'Migrations ended with errors'}`);
      }
    } catch (error) {
      logger.error(`Migrations have failed, the app will not start. Check lms_migrations_cluster collection for more info. Err ${error}`);
      throw new Error(`Migrations have failed ${error}`);
    } finally {
      logger.info('Migrations ended');
    }
  }

  async executeMigrations() {
    const parallelJob = await Promise.map([this.getLastExecutedMigration, this.migrationReader], (fn) => fn.call(this));
    const lastExecutedMigration = _.defaultTo(parallelJob[0], '19000101000000');
    const migrationFiles = parallelJob[1];
    const lastExecutedMigrationDate = moment(lastExecutedMigration, 'YYYYMMDDHHmmss');
    const migrationsToExecute = migrationFiles.filter((migration) => {
      const migrationName = filenameToMoment(migration);
      return moment(migrationName, 'YYYYMMDDHHmmss').isAfter(lastExecutedMigrationDate);
    });
    if (migrationsToExecute.length === 0) {
      this.failedMigration = '';
      this.areMigrationsRunning = false;
      this.logger.info(`Nothing to migrate from pid ${process.pid}. Last executed migration is ${lastExecutedMigration} from pid: ${process.pid}`);
      return this.setRunningLock({
        status: false,
        hasFailed: false,
        lastExecuted: lastExecutedMigration,
      });
    }
    const wasLocked = await this.lockMigrationRunner();
    if (!wasLocked) {
      this.logger.info(`Migrations: Will not execute any migration in pid: ${process.pid}`);
      return this.getMigrationRunnerFlag();
    }
    this.areMigrationsRunning = true;
    this.logger.info(`There are ${migrationsToExecute.length} unexecuted migrations from pid ${process.pid}`);
    let migrationBeingExecuted = '';

    try {
      await Promise.mapSeries(migrationsToExecute, async (migrationPath) => {
        const migrationName = filenameToMoment(migrationPath);
        this.logger.info(`Will try running migration "${migrationName}" from pid ${process.pid}`);
        migrationBeingExecuted = migrationName;
        const isExecuted = await this.schema.Migration.findOne({ name: migrationName });
        this.logger.info(`Migration "${migrationName}" is executed? ${isExecuted} from pid ${process.pid}`);
        if (!isExecuted) {
          this.logger.info(`About to execute migration "${migrationName}" from pid ${process.pid}`);
          await this.executorFactory(migrationPath).execute();
          this.logger.info(`Marking migration "${migrationName}" as executed from pid ${process.pid}`);
          const executedMigration = new this.schema.Migration({
            name: migrationName, executed: moment.utc().toDate(),
          });
          this.logger.debug(`Migration "${migrationName}" was executed. Saving status from pid ${process.pid}`);
          return executedMigration.save();
        }
      });
      await this.setRunningLock({ status: false, hasFailed: false });
      this.failedMigration = '';
      this.areMigrationsRunning = false;
    } catch (err) {
      const message = _.get(err, 'message', err);
      this.logger.error(`Error executing migration "${migrationBeingExecuted}": ${message} => ${err.stack} from pid ${process.pid}`);
      const failedReason = `Migration ${migrationBeingExecuted} [${moment.utc().toDate()}]: ${message}`;
      const missedMigrations = migrationFiles.map((filename) => filenameToMoment(filename))
        .filter((migrationName) => migrationName > migrationBeingExecuted);
      const migrationWordSuffix = `Migration${missedMigrations.length > 1 ? 's' : ''}`;
      const hasWordSuffix = `ha${missedMigrations.length > 1 ? 've' : 's'}`;
      const missedMigrationsMessage = `${migrationWordSuffix} ${missedMigrations.join(', ')} ${hasWordSuffix} not run as a result. from pid ${process.pid}`;
      const migrationsListText = missedMigrations.length > 0 ? missedMigrationsMessage : '';
      this.failedMigration = `Error executing migration "${migrationBeingExecuted}": ${message}. ${migrationsListText} from pid ${process.pid}`;
      await this.setRunningLock({ status: false, hasFailed: true, failedReason });
      this.areMigrationsRunning = false;
      throw new Error(`Migrations have failed to execute with err: ${this.failedMigration} with pid ${process.pid}`);
    }
  }
}

module.exports = MigrationRunner;
