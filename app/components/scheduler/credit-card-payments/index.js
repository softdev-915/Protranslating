const _ = require('lodash');
const logger = require('../../log/scheduler-logger');
const CcPaymentsApi = require('../../../endpoints/lsp/cc-payments/cc-payments-api');

const IN_PROGRESS_STATUSES = ['DRAFTED', 'CAPTURED'];

class CcPaymentsScheduler {
  constructor(configuration, options, schema) {
    this.currentJob = '';
    this.logger = logger;
    this.schema = schema;
    this.configuration = configuration;
  }

  async run(job, done) {
    const lspId = _.get(job, 'attrs.data.lspId');
    const flags = _.get(job, 'attrs.data.flags', {});
    const query = { lspId, status: { $in: IN_PROGRESS_STATUSES } };
    const options = { configuration: this.configuration, user: { lsp: { _id: lspId } }, flags };
    const api = new CcPaymentsApi(this.logger, options);

    try {
      await this.schema.CcPayment.find(query)
        .cursor({ batchSize: 1 })
        .eachAsync((payment) => {
          this.logger.info(`Adjusting the status for ${payment._id}`);
          return api.adjustPaymentStatus(payment, flags)
            .catch((e) => this.logger.error(`Failed to adjust status for ${payment._id}. ${e}`));
        });
      done();
    } catch (e) {
      this.logger.error(`Failed to run credit card payment scheduler. Error: ${e}`);
      done(e);
    }
  }
}
module.exports = CcPaymentsScheduler;
