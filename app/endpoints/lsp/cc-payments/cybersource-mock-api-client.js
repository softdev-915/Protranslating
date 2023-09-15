const _ = require('lodash');
const Promise = require('bluebird');
const moment = require('moment-timezone');
const CyberSourceApiClient = require('./cybersource-api-client');
const { PAYMENT_STATUSES } = require('./cc-payment-helpers');

class CybersourceMockApiClient extends CyberSourceApiClient {
  constructor(logger, flags) {
    super(logger);
    this.flags = flags;
  }

  // eslint-disable-next-line no-unused-vars
  transmitPayment(payment, credentials, card) {
    return new Promise((resolve, reject) => {
      if (_.get(this.flags, 'shouldMockCsNotReceivedRequest', false)) {
        return reject(new Error('Failure to push the payment to CS mocked'));
      }
      if (_.get(this.flags, 'shouldMockNoResponseFromCs', false)) {
        return reject(new Error('No response from CS mocked'));
      }
      payment.errorInformation = '';
      payment.status = _.get(this.flags, 'mockTrStatus', PAYMENT_STATUSES.DRAFTED);
      payment.transactionId = this.generateTransactionFakeId();
      payment.wasSentToProvider = true;
      resolve();
    });
  }

  // eslint-disable-next-line no-unused-vars
  async getTransactionStatus(transactionId, credentials) {
    if (
      _.get(this.flags, 'mockTrDetailsNoResponseFromCs', false)
      || _.get(this.flags, 'shouldMockNoResponseFromCs', false)
    ) {
      throw new Error('Mocked no response from provider on transaction details');
    }
    let receiptDate = moment.tz(this.flags.mockTrSubmitTime, 'DD-MM-YYYY-hh-mm', 'UTC');
    if (!receiptDate.isValid()) {
      receiptDate = moment();
    }
    return {
      status: _.get(this.flags, 'mockTrStatus', PAYMENT_STATUSES.DRAFTED),
      receiptDate: receiptDate.toISOString(),
    };
  }

  // eslint-disable-next-line no-unused-vars
  findTransaction(payment, credentials) {
    return new Promise(async (resolve, reject) => {
      if (_.get(this.flags, 'mockTrSearchNoResponseFromCs', false)) {
        return reject(new Error('Mocked no response from provider on transaction search'));
      }
      if (_.get(this.flags, 'mockTrDetailsNoResponseFromCs', false)) {
        return reject(new Error('Mocked. Failed to get response from Cybersource'));
      }
      payment.transactionId = this.generateTransactionFakeId();
      await payment.save();
      resolve();
    });
  }

  generateTransactionFakeId() {
    return `fakeId_${_.random(10000000, 10000000000)}`;
  }
}

module.exports = CybersourceMockApiClient;
