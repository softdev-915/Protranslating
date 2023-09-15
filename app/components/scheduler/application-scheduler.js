/* eslint-disable global-require,import/no-dynamic-require */
const _ = require('lodash');
const Promise = require('bluebird');
const { schedulerFactory } = require('./scheduler-factory');
const { models: mongooseSchema } = require('../database/mongo');
const appLogger = require('../log/logger');

class ApplicationScheduler {
  /**
   * @constructor
   * Creates an ApplicationScheduler object.
   * @param {Object} agenda the agenda used to manage the scheduled
   * @param {Object} configuration
   *  jobs execution.
   */
  constructor(agenda, configuration) {
    this.agenda = agenda;
    this.schema = mongooseSchema;
    this.logger = appLogger;
    this.schedulerFactory = schedulerFactory;
    this.configuration = configuration;
  }

  _buildJobName(scheduleJob, lspId) {
    const scheduleJobName = _.get(scheduleJob, 'name', scheduleJob);
    const scheduleJobLspId = _.get(scheduleJob, 'lspId', lspId);
    if (scheduleJobName.match(/backup-notifications-monthly/)) {
      return scheduleJobName;
    }
    return `${scheduleJobName}-${scheduleJobLspId.toString()}`;
  }

  async cancelJob(params) {
    return this.agenda.cancel(params);
  }

  async configure() {
    await this.agenda.stop();
    const scheduledJobs = await this.schema.Scheduler.find({ deleted: { $ne: true } });

    await Promise.mapSeries(scheduledJobs, async (s) => {
      await this.setupJob(s);
    });
    await this.agenda.start();

    this.logger.info('[Application scheduler was started]');
  }

  async setupJob(job) {
    const handler = this.schedulerFactory(job, this.configuration);
    if (!handler) {
      this.logger.error(`No handler defined for ${job.name}`);
      return;
    }
    const jobName = this._buildJobName(job);
    const lspId = _.get(job, 'lspId');

    if (!lspId) {
      throw new Error(`Error scheduling job ${jobName}: No lspId defined`);
    }
    const emailObject = job.email.toJSON();
    const attrs = { emailObject, lspId, nameWithoutLsp: job.name };
    this.agenda.define(jobName, handler.run.bind(handler));

    if (job.every) {
      this.agenda.every(job.every, jobName, attrs, job.options);
    }

    if (job.schedule) {
      this.agenda.schedule(job.schedule, jobName, attrs);
    }
  }

  onAgendaJobFinished() {
    this.logger.debug('Agenda: execution finished');
  }

  runNow(dbScheduler, params = {}) {
    this.logger.debug('Agenda: Running job now');
    const lspId = _.get(dbScheduler, 'lspId');
    const name = _.get(dbScheduler, 'name');
    const jobName = this._buildJobName(name, lspId);
    // Trigger an error if lspId is undefined, from now on we cannot run or schedule agenda tasks
    // without specifying lspId, please make the change and put a note on the code
    if (!lspId) {
      this.logger.error(`Error running job ${name}: No lspId defined`);
      throw new Error(`Error running job ${name}: No lspId defined`);
    }
    return this.agenda.now(jobName, {
      lspId,
      params,
      nameWithoutLsp: name,
    });
  }
}

module.exports = ApplicationScheduler;
