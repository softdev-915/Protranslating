const _ = require('lodash');
const moment = require('moment');
const SchemaAwareAPI = require('../../schema-aware-api');
const { isAdjustment, DEBIT_MEMO, PAYMENT, INVOICE } = require('../ar-payment/ar-payment-api-helpers');
const { searchFactory, exportFactory } = require('../../../utils/pagination');
const { CsvExport } = require('../../../utils/csvExporter');
const { RestError } = require('../../../components/api-response');
const { extraQueryParams, extraPipelines } = require('./cc-payment-helpers');
const { PAYMENT_STATUSES } = require('./cc-payment-helpers');
const ArPaymentApi = require('../ar-payment/ar-payment-api');
const cybersourceApiFactory = require('./cybersource-api-factory');

class CcPaymentsApi extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.logger = logger;
    this.configuration = _.get(options, 'configuration');
  }

  _getQueryFilters(filters) {
    const { lspId } = this;
    const query = Object.assign({ lspId }, _.get(filters, 'paginationParams', {}));
    return query;
  }

  async export(filters) {
    const query = this._getQueryFilters(filters);
    try {
      const queryObj = await exportFactory(
        this.schema.CcPayment,
        query,
        extraPipelines(this.user),
        extraQueryParams(),
        filters.__tz,
      );
      const csvExporter = new CsvExport(queryObj, {
        schema: this.schema.CcPayment,
        lspId: this.lspId,
        logger: this.logger,
        configuration: this.configuration,
      });
      return csvExporter.export();
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error exporting to CSV: ${message}`);
      throw new RestError(500, { message });
    }
  }

  async list(filters) {
    const query = Object.assign({ lspId: this.lspId }, _.get(filters, 'paginationParams', {}));
    const list = await searchFactory({
      model: this.schema.CcPayment,
      filters: query,
      extraPipelines: extraPipelines(),
      extraQueryParams: extraQueryParams(),
      utcOffsetInMinutes: filters.__tz,
    }).exec();
    return { list: list, total: list.length };
  }

  async create({ paymentData, mockingFlags }) {
    await this._setPaymentGateway();
    const payment = await this.schema.CcPayment.createNewPayment(paymentData, this.lspId);
    await payment.save();
    const cybersourceApiClient = cybersourceApiFactory(this.logger, { flags: mockingFlags });
    await cybersourceApiClient.transmitPayment(payment, this.paymentGateway, paymentData.card);
    await payment.save();
    if (!_.isEmpty(payment.errorInformation)) {
      throw new RestError(400, { message: payment.errorInformation });
    }
    return { transactionId: payment.transactionId };
  }

  async getPaymentStatus(entityNo, flags) {
    const query = {
      lspId: this.lspId,
      entityNo,
      status: { $ne: PAYMENT_STATUSES.FAILED },
      wasSentToProvider: true,
    };
    const payments = await this.schema.CcPayment.find(query);
    if (_.isEmpty(payments)) {
      return PAYMENT_STATUSES.NOT_FOUND;
    }
    if (payments.length > 1) {
      throw new RestError(500, { message: `Multiple payments in process for ${entityNo}` });
    }
    const [payment] = payments;
    if (payment.status === PAYMENT_STATUSES.TRANSMITTED) {
      return PAYMENT_STATUSES.TRANSMITTED;
    }
    await this.adjustPaymentStatus(payment, flags);
    return payment.status;
  }

  async _setPaymentGateway() {
    const lsp = await this.schema.Lsp.findOne({ _id: this.lspId });
    const pgName = _.get(lsp, 'paymentGateway.name');
    if (_.isEmpty(pgName)) {
      throw new RestError(500, { message: 'Payment Gateway is not specified!' });
    }
    this.paymentGateway = lsp.paymentGateway;
  }

  async adjustPaymentStatus(payment, flags = {}) {
    if (payment.status === PAYMENT_STATUSES.TRANSMITTED) {
      return;
    }
    const transactionId = _.get(payment, 'transactionId', '');
    if (transactionId.startsWith('fakeId')) {
      flags.mock = true;
    }
    if (_.isNil(this.paymentGateway)) {
      await this._setPaymentGateway();
    }
    const cybersourceApiClient = cybersourceApiFactory(this.logger, { flags });

    if (_.isEmpty(transactionId)) {
      await cybersourceApiClient.findTransaction(payment, this.paymentGateway);
    }
    if (!transactionId) {
      return;
    }
    let transactionInfo;
    try {
      transactionInfo = await cybersourceApiClient.getTransactionStatus(
        transactionId,
        this.paymentGateway,
      );
    } finally {
      Object.assign(payment, {
        status: transactionInfo.status,
        internalError: null,
        updatedAt: moment().toISOString(),
      });
      await payment.save();
      if (payment.status === PAYMENT_STATUSES.TRANSMITTED) {
        await this._createArPayment(payment, transactionInfo.receiptDate);
      }
    }
  }

  async _createArPayment(payment, receiptDate) {
    const schema = isAdjustment(payment.entityNo) ?
      this.schema.ArAdjustment : this.schema.ArInvoice;
    const arPaymentApi = new ArPaymentApi(this.logger,
      {
        user: this.user,
        configuration: this.configuration,
        flags: this.flags,
      });
    const entity = await schema.findOne({ no: payment.entityNo });
    if (_.isNil(entity)) {
      throw new RestError(`Failed to find entity with no ${payment.entityNo}`);
    }
    const arPaymentData = await this._newArPayment(payment, entity, receiptDate);
    await arPaymentApi.create(arPaymentData);
  }

  async _newArPayment(ccPayment, entity, receiptDate) {
    const paymentMethod = await this.schema.PaymentMethod.findOne({ name: 'Credit Card' });
    const targetType = isAdjustment(entity) ? DEBIT_MEMO : INVOICE;
    const sourceType = PAYMENT;
    return {
      company: {
        _id: entity.company._id,
        hierarchy: entity.company.hierarchy,
      },
      description: ccPayment._id.toString(),
      date: moment().toISOString(),
      receiptDate,
      sourceType,
      targetType,
      method: paymentMethod,
      amount: ccPayment.amount,
      currency: entity.accounting.localCurrency._id.toString(),
      target: [{ _id: entity._id, applied: ccPayment.amount, ccPayment: ccPayment._id }],
    };
  }
}

module.exports = CcPaymentsApi;
