const _ = require('lodash');
const Cybersource = require('cybersource-rest-client');
const Promise = require('bluebird');
const { LOCAL_PAYMENT_STATUSES } = require('./cc-payment-helpers');

class CybersourceApiClient {
  constructor(logger) {
    this.logger = logger;
  }

  _createConfig(credentials) {
    return {
      authenticationType: 'http_signature',
      runEnvironment: credentials.isProduction ? 'api.cybersource.com' : 'apitest.cybersource.com',
      merchantID: credentials.id,
      merchantKeyId: credentials.key,
      merchantsecretKey: credentials.secret,
      logConfiguration: {
        enableLog: false,
      },
    };
  }

  transmitPayment(payment, credentials, card) {
    const client = new Cybersource.ApiClient();
    const config = this._createConfig(credentials);
    const requestObj = this._createPaymentRequest(payment, card);
    const instance = new Cybersource.PaymentsApi(config, client);
    return new Promise((resolve, reject) => {
      instance.createPayment(requestObj, (error, data) => {
        if (error) {
          const message = _.get(error, 'message', '');
          return reject(new Error(`Failed to get response from Cybersource ${message}`));
        }
        payment.errorInformation = _.get(data, 'errorInformation.message', '');
        payment.status = LOCAL_PAYMENT_STATUSES[data.status];
        payment.transactionId = data.id;
        payment.wasSentToProvider = true;
        resolve();
      });
    });
  }

  async getTransactionStatus(transactionId, credentials) {
    this.logger.info(`Looking transaction id for payment with transaction id ${transactionId}`);
    const info = await this.getTransactionInfo(transactionId, credentials);
    const status = _.get(info, 'applicationInformation.status');
    const localStatus = LOCAL_PAYMENT_STATUSES[status];
    this.logger.info(`Status for payment ${transactionId} is set to ${localStatus}`);
    return {
      status: localStatus,
      receiptDate: _.get(info, 'submitTimeUTC'),
    };
  }

  getTransactionInfo(transactionId, credentials) {
    const apiClient = new Cybersource.ApiClient();
    const config = this._createConfig(credentials);
    const instance = new Cybersource.TransactionDetailsApi(config, apiClient);
    return new Promise((resolve, reject) => {
      instance.getTransaction(transactionId, (error, data) => (_.isNil(error) ? resolve(data) : reject(error)));
    });
  }

  findTransaction(payment, credentials) {
    this.logger.info(`Looking transaction id for payment ${payment._id}`);
    const apiClient = new Cybersource.ApiClient();
    const config = this._createConfig(credentials);
    const instance = new Cybersource.SearchTransactionsApi(config, apiClient);
    const requestObj = this._createTrSearchRequest(payment.entityNo);
    return new Promise((resolve, reject) => {
      instance.createSearch(requestObj, async (error, data) => {
        if (error) {
          const message = _.get(error, 'message', '');
          return reject(new Error(`Failed to get response from Cybersource ${message}`));
        }
        const trId = _.get(data, '_embedded.transactionSummaries[0].id');
        if (_.isNil(trId)) {
          return reject(new Error(`No transaction for payment with id ${payment._id} found`));
        }
        this.logger.info(`Transaction id for payment ${payment._id} is set to ${trId}`);
        payment.transactionId = trId;
        await payment.save();
        resolve();
      });
    });
  }

  _createPaymentRequest(payment, card) {
    const request = new Cybersource.CreatePaymentRequest();
    const clientReferenceInformation = new Cybersource.Ptsv2paymentsClientReferenceInformation();
    clientReferenceInformation.code = payment.entityNo;
    request.clientReferenceInformation = clientReferenceInformation;

    const processingInformation = new Cybersource.Ptsv2paymentsProcessingInformation();
    processingInformation.capture = true;
    request.processingInformation = processingInformation;

    const paymentInformation = new Cybersource.Ptsv2paymentsPaymentInformation();
    const paymentInformationCard = new Cybersource.Ptsv2paymentsPaymentInformationCard();
    paymentInformationCard.number = card.no;
    paymentInformationCard.expirationMonth = card.month;
    paymentInformationCard.expirationYear = card.year;
    paymentInformation.card = paymentInformationCard;

    request.paymentInformation = paymentInformation;

    const orderInformation = new Cybersource.Ptsv2paymentsOrderInformation();
    const amountDetails = new Cybersource.Ptsv2paymentsOrderInformationAmountDetails();
    amountDetails.totalAmount = payment.amount;
    amountDetails.currency = payment.currency;
    orderInformation.amountDetails = amountDetails;

    const orderInformationBillTo = new Cybersource.Ptsv2paymentsOrderInformationBillTo();
    orderInformationBillTo.firstName = payment.billTo.firstName;
    orderInformationBillTo.lastName = payment.billTo.lastName;
    orderInformationBillTo.address1 = payment.billTo.address1;
    orderInformationBillTo.address2 = payment.billTo.address2;
    orderInformationBillTo.locality = payment.billTo.city;
    orderInformationBillTo.administrativeArea = payment.billTo.state.includes('-')
      ? payment.billTo.state.split('-')[1] : payment.billTo.state;
    orderInformationBillTo.postalCode = payment.billTo.zipCode;
    orderInformationBillTo.country = payment.billTo.country;
    orderInformationBillTo.email = payment.billTo.email;
    orderInformation.billTo = orderInformationBillTo;
    request.orderInformation = orderInformation;
    return request;
  }

  _createTrSearchRequest(entityNo) {
    const requestObj = new Cybersource.CreateSearchRequest();
    requestObj.save = false;
    requestObj.query = `clientReferenceInformation.code:${entityNo} AND submitTimeUtc:[NOW/DAY-7DAYS TO NOW/DAY+1DAY}`;
    requestObj.offset = 0;
    requestObj.limit = 1;
    requestObj.sort = 'id:desc,submitTimeUtc:desc';
    return requestObj;
  }
}

module.exports = CybersourceApiClient;
