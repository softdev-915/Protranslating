const _ = require('lodash');
const Promise = require('bluebird');
const appLogger = require('../log/logger');

const STATUS_RUNNING = 'running';
const STATUS_ERROR = 'error';
const STATUS_SUCCESS = 'success';

class SchedulerJobObserver {
  constructor(schema, scheduler) {
    this.schema = schema;
    this.scheduler = scheduler;
    this.logger = appLogger;
  }

  async saveJobStatus(job, status, error) {
    const stats = {
      executed: new Date(),
      status,
      error,
    };
    let dbScheduler;
    const lspId = _.get(job, 'attrs.data.lspId');
    const name = _.get(job, 'attrs.data.nameWithoutLsp');
    const query = { name, lspId };
    const oldDbScheduler = await this.schema.Scheduler.findOne(query, { executionHistory: 1 });

    if (_.isNil(oldDbScheduler)) {
      throw new Error(`Scheduler with name: ${name} and lspId: ${lspId.toString()} was not found in schedulers collection`);
    }
    if (_.get(oldDbScheduler, 'executionHistory[0].status') !== stats.status) {
      dbScheduler = await this.schema.Scheduler.findOneAndUpdate(query, {
        $push: {
          executionHistory: { $each: [stats], $position: 0, $slice: 24 },
        },
      }, { runValidators: true, new: true });
    }
    if (!_.isNil(this.logger)) {
      this.logger.debug(`Scheduler "${name}" for lspId: ${lspId.toString()} was executed at ${stats.executed} and has status "${stats.status}"`);
    }
    return dbScheduler;
  }

  async runScheduler(job) {
    await this.saveJobStatus(job, STATUS_RUNNING);
    return new Promise((resolve) => {
      this.scheduler.run(job, (err) => {
        const lspId = _.get(job, 'attrs.data.lspId');
        let jobStatus = STATUS_SUCCESS;
        let errMessage;

        if (err) {
          errMessage = err.message || err;
          jobStatus = STATUS_ERROR;
          this.logger.error(`Error running job ${job.attrs.name} for lspId ${lspId.toString()}. Error: ${errMessage}`);
        } else {
          this.logger.debug(`Running job ${job.attrs.name} for lspId ${lspId.toString()}`);
        }
        return this.saveJobStatus(job, jobStatus, errMessage).then((resolve));
      });
    });
  }

  async run(job) {
    const lspId = _.get(job, 'attrs.data.lspId');
    if (!lspId) {
      const message = `Error running job ${job.attrs.name}: No lspId defined`;
      this.logger.error(message);
      await this.saveJobStatus(job, STATUS_ERROR, message);
      throw new Error(message);
    }
    try {
      this.logger.debug(`Marking job ${job.attrs.name} status as running for lspId ${lspId.toString()}`);
      await this.runScheduler(job);
    } catch (error) {
      const message = error.message || error;

      this.logger.error(`Error running job ${job.attrs.name} for lspId ${lspId.toString()}. Error: ${message}`);
      return this.saveJobStatus(job, STATUS_ERROR, message);
    }
  }
}

module.exports = SchedulerJobObserver;
