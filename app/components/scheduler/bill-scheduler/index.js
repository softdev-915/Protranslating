const _ = require('lodash');
const Promise = require('bluebird');
const logger = require('../../log/logger');
const EmailQueue = require('../../email/templates');
const SiConnectorAPI = require('../../../connectors/si/si-connector-api');
const { models: mongooseSchema } = require('../../database/mongo');

class BillScheduler {
  constructor(user, flags) {
    this.user = user;
    this.flags = flags;
    this.currentJob = '';
    this.logger = logger;
    this.schema = mongooseSchema;
    this.emailQueue = new EmailQueue(this.logger, mongooseSchema);
    this.billsToBeSynced = [];
  }

  getLogMessage(message) {
    return `${this.name}: ${message}`;
  }

  async updateVendorBalances(createdBills) {
    const processedVendors = [];

    await Promise.map(
      createdBills,
      async (bill) => {
        if (processedVendors.includes(bill.vendor.toString())) {
          return;
        }
        processedVendors.push(bill.vendor.toString());
        await this.schema.User.lockDocument({ _id: bill.vendor });
        await this.schema.User.consolidateVendorBalance(bill.vendor);
      },
      { concurrency: 10 },
    );
    this.logger.debug(`${this.getLogMessage()}: Finished updating vendor balances`);
  }

  async getLsp() {
    const userLspId = _.get(this.user, 'lsp._id');
    const jobLspId = _.get(this, 'currentJob.attrs.data.lspId', '');
    const lspId = _.isEmpty(jobLspId) ? userLspId : jobLspId;

    if (lspId === '') {
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

  get currentVendorId() {
    return this.currentJob.attrs?.data?.params?.entityId;
  }

  async syncCreatedBills() {
    if (!_.isEmpty(this.billsToBeSynced)) {
      const siAPI = new SiConnectorAPI(this.flags);
      await siAPI.syncApBills({ _id: { $in: this.billsToBeSynced } });
    }
    this.logger.debug(this.getLogMessage(`${this.lsp.name} ended`));
  }

  async run(job, done) {
    let err = null;

    this.currentJob = job;
    this.billsToBeSynced = [];
    try {
      await this.createBills();
      await this.syncCreatedBills();
      this.logger.debug(this.getLogMessage('Finished executing scheduler'));
    } catch (error) {
      err = error;
      this.logger.error(this.getLogMessage(`Error ${JSON.stringify(error)}`));
    } finally {
      done(err);
    }
  }
}

module.exports = BillScheduler;
