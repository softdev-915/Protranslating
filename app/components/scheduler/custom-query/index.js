const _ = require('lodash');
const Promise = require('bluebird');
const logger = require('../../log/scheduler-logger');
const CustomQueryRunner = require('../../custom-query/custom-query-runner');
const EmailQueue = require('../../email/templates');
const { SCHEDULER_NAME_LAST_RESULT } = require('../../../utils/custom-query');

class CustomQueryScheduler {
  constructor(schema) {
    this.currentJob = '';
    this.logger = logger;
    this.schema = schema;
    this.emailQueue = new EmailQueue(this.logger, schema);
  }

  getLogMessage(message) {
    const name = _.get(this.currentJob, 'attrs.data.nameWithoutLsp', 'custom-query');
    return `Running ${name} job: ${message}`;
  }

  async getLsp() {
    const lspId = _.get(this, 'currentJob.attrs.data.lspId');

    if (_.isNil(lspId)) {
      const message = this.getLogMessage('No lspId defined');

      this.logger.error(message);
      throw new Error(message);
    }
    const lsp = await this.schema.Lsp.findById(lspId);

    if (_.isNil(lsp)) {
      const message = this.getLogMessage(`No LSP with id ${lspId} found`);

      this.logger.error(message);
      throw new Error(message);
    }
    return lsp;
  }

  async run(job, done) {
    this.currentJob = job;
    const lsp = await this.getLsp();
    const flags = _.get(job, 'attrs.flags');
    try {
      this.logger.info(this.getLogMessage(`${lsp.name} started`));
      const runner = new CustomQueryRunner(this.schema, lsp);
      const executedCustomQueries = await runner.run(flags);
      await Promise.map(executedCustomQueries, async (customQuery) => {
        await this.emailQueue.send({
          templateName: SCHEDULER_NAME_LAST_RESULT,
          context: { customQuery, user: customQuery.user, host: lsp.url },
          lspId: customQuery.lspId,
        });
      });
    } catch (error) {
      this.logger.error(this.getLogMessage(`Error ${JSON.stringify(error.message)}`));
    }
    this.logger.info(this.getLogMessage(`${lsp.name} ended`));
    if (_.isFunction(done)) {
      done();
    }
  }
}

module.exports = CustomQueryScheduler;
