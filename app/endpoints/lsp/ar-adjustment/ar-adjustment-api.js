const _ = require('lodash');
const Promise = require('bluebird');
const mongoose = require('mongoose');
const SchemaAwareAPI = require('../../schema-aware-api');
const CloudStorage = require('../../../components/cloud-storage');
const { searchFactory, exportFactory } = require('../../../utils/pagination');
const { RestError } = require('../../../components/api-response');
const { CsvExport } = require('../../../utils/csvExporter');
const Big = require('big.js');
const SiConnectorAPI = require('../../../connectors/si/si-connector-api');
const assignAttachmentManagementMethods = require('../../../utils/attachments');

const { ObjectId } = mongoose.Types;
const ROLES = {
  READ_ALL: 'AR-ADJUSTMENT_READ_ALL',
  READ_OWN: 'AR-ADJUSTMENT_READ_OWN',
  READ_COMPANY: 'AR-ADJUSTMENT_READ_COMPANY',
};
const CONTACT_TYPE = 'Contact';
const getBeforeMatchPipeline = () => [
  {
    $lookup: {
      from: 'companies',
      localField: 'company',
      foreignField: '_id',
      as: 'company',
    },
  },
  {
    $lookup: {
      from: 'users',
      let: { contactId: '$contact' },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$_id', '$$contactId'],
            },
          },
        },
        {
          $project: { _id: 1, firstName: 1, lastName: 1 },
        },
      ],
      as: 'contacts',
    },
  },
  {
    $addFields: {
      companyId: '$company._id',
      company: '$company.hierarchy',
    },
  },
  {
    $addFields: {
      contactObj: { $arrayElemAt: ['$contacts', 0] },
    },
  },
];
const extraPipelines = (user) => {
  const projectStage = {
    $project: {
      balance: 1,
      company: 1,
      companyId: 1,
      contact: 1,
      contactId: 1,
      createdAt: 1,
      createdBy: 1,
      currency: 1,
      date: 1,
      deletedAt: 1,
      deletedBy: 1,
      invoiceNo: 1,
      isSynced: 1,
      lastSyncDate: 1,
      no: 1,
      paid: 1,
      restoredAt: 1,
      restoredBy: 1,
      status: 1,
      syncError: 1,
      total: 1,
      type: 1,
      updatedAt: 1,
      updatedBy: 1,
      description: 1,
    },
  };
  if (user.has('AR-ADJUSTMENT-ACCT_READ_ALL')) {
    Object.assign(projectStage.$project, {
      exchangeRate: 1,
      localAmount: 1,
      glPostingDate: 1,
      localCurrency: 1,
    });
  }
  return [
    {
      $addFields: {
        contactId: '$contactObj._id',
        contact: { $concat: ['$contactObj.firstName', ' ', '$contactObj.lastName'] },
        currency: '$accounting.currency.isoCode',
        localCurrency: '$accounting.localCurrency.isoCode',
        total: { $toString: '$accounting.amount' },
        exchangeRate: { $toString: '$accounting.exchangeRate' },
        localAmount: { $toString: '$accounting.amountInLocal' },
        paid: { $toString: '$accounting.paid' },
        balance: { $toString: '$accounting.balance' },
        isSynced: { $toString: '$siConnector.isSynced' },
        syncError: { $toString: '$siConnector.syncError' },
        lastSyncDate: '$siConnector.connectorEndedAt',
      },
    },
    projectStage,
  ];
};

const extraQueryParams = () => ['company', 'contact', 'currency', 'localCurrency', 'total', 'exchangeRate',
  'localAmount', 'paid', 'balance', 'isSynced', 'syncError', 'lastSyncDate'];

class AdjustmentsApi extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.logger = logger;
    this.configuration = _.get(options, 'configuration');
    this.cloudStorage = new CloudStorage(this.configuration);
    this.extraPipelines = extraPipelines(this.user);
    assignAttachmentManagementMethods(this, this.schema.ArAdjustment);
    this.mock = _.get(options, 'mock', false);
  }

  _getQueryFilters(filters) {
    const paginationParams = _.get(filters, 'paginationParams');
    const query = _.assign({}, { lspId: this.lspId }, paginationParams);
    if (!this.user.has(ROLES.READ_ALL)) {
      this._setRoleFilters(query);
    }
    return query;
  }

  async list(filters) {
    const query = this._getQueryFilters(filters);
    const list = await searchFactory({
      model: this.schema.ArAdjustment,
      filters: query,
      extraPipelines: extraPipelines(this.user),
      extraQueryParams: extraQueryParams(),
      utcOffsetInMinutes: filters.__tz,
      beforeMatchPipeline: getBeforeMatchPipeline(),
    }).exec();
    return { list: list, total: list.length };
  }

  async export(filters) {
    const query = this._getQueryFilters(filters);
    try {
      const queryObj = await exportFactory(
        this.schema.ArAdjustment,
        query,
        extraPipelines(this.user),
        extraQueryParams(),
        filters.__tz,
        getBeforeMatchPipeline(),
      );
      const csvExporter = new CsvExport(queryObj, {
        schema: this.schema.ArAdjustment,
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

  async getById(_id) {
    const adjustment = await this.schema.ArAdjustment
      .findOne({ lspId: this.lspId, _id })
      .populate([{
        path: 'company',
        select: '_id name hierarchy',
        options: { lean: true, withDeleted: true },
      }, {
        path: 'contact',
        select: 'firstName lastName',
        options: { lean: true, withDeleted: true },
      }]);
    if (_.isNil(adjustment)) {
      throw new RestError(404, { message: `Adjustment ${_id} for lsp ${this.lspId}not found` });
    }
    return adjustment.toObject();
  }

  async create(data) {
    this.logger.debug(`Ar adjustment: ${this.user.email} triggered ar adjustment creation for company ${data.companyId}`);
    let newAdjustment;
    const shouldMockCreationError = _.get(this.flags, 'shouldMockCreationError', false);
    await this.provideTransaction(async (session) => {
      await this._populateAdjustmentData(data);
      this.logger.debug(`Ar adjustment: ${this.user.email} creating model`);
      newAdjustment = new this.schema.ArAdjustment(data);
      _.set(newAdjustment, 'siConnector', {
        isMocked: this.mock,
        isSynced: false,
        error: null,
      });
      this.logger.debug(`Ar adjustment: ${this.user.email} locking company ${newAdjustment.company}`);
      await this.schema.Company.lockCompanyHierarchy(newAdjustment.company, session);
      this.logger.debug(`Ar adjustment: ${this.user.email} finished locking company ${newAdjustment.company}`);
      const { financialEntityPrefix } = await this.schema.Lsp.findById(this.lspId, 'financialEntityPrefix');
      if (_.isNil(financialEntityPrefix)) {
        throw new RestError(400, { message: 'Financial Entity Prefix must be specified in the lsp settings' });
      }
      this.logger.debug(`Ar adjustment: ${this.user.email} saving model ${_.get(newAdjustment, '_id')}`);
      newAdjustment.setAccountingDetails();
      await this.schema.ArAdjustment.setNo(newAdjustment, session);
      await newAdjustment.save({ session });
      if (shouldMockCreationError) {
        throw new RestError(400, { message: 'Failed to create adjustment' });
      }
      this.logger.debug(`Ar adjustment: ${this.user.email} consolidating balance for company ${newAdjustment.company}`);
      await this.schema.Company.consolidateBalance(newAdjustment.company, session);
      this.logger.debug(`Ar adjustment: ${this.user.email} finished consolidating balance for company ${newAdjustment.company}`);
    }, undefined, `Ar adjustment: ${this.user.email}`);
    this.logger.debug(`Ar adjustment: ${this.user.email} started sync adjustment ${_.get(newAdjustment, '_id')}`);
    (new SiConnectorAPI(this.flags)).syncArAdjustments({ _id: newAdjustment._id })
      .catch(e => this.logger.error(e));
    return newAdjustment.toObject();
  }

  async edit(data) {
    const adjustment = await this.schema.ArAdjustment.findOne({ _id: data._id });
    if (_.isNil(adjustment)) {
      throw new RestError(500, { message: `Adjustment with _id: ${data._id} no found` });
    }
    await this._populateAdjustmentData(data);
    if (this.mock) {
      _.set(data, 'siConnector.isMocked', true);
    }
    _.assign(adjustment, data);
    adjustment.setAccountingDetails();
    await adjustment.save();
    (new SiConnectorAPI(this.flags)).syncArAdjustments({ _id: adjustment._id })
      .catch(e => this.logger.error(e));
    return adjustment.toObject();
  }

  async _populateAdjustmentData(data) {
    const { invoiceNo, currencyId, ownEntries, invoiceEntries, companyId, contactId } = data;
    this.logger.debug(`Ar adjustment: ${this.user.email} started _populateAdjustmentData for company ${companyId}`);
    const isValidInvoiceNo = !_.isEmpty(data.invoiceNo);
    const promises = [
      this.schema.Lsp.getExchangeDetails(this.lspId, currencyId),
    ];
    if (isValidInvoiceNo) {
      promises.push(this.schema.ArInvoice.findOne({ no: invoiceNo }));
    }
    const [exchangeDetails, invoice] = await Promise.all(promises);
    const { base, quote, quotation } = exchangeDetails;
    const invoiceCurrencyId = _.get(invoice, 'accounting.currency._id');
    if (isValidInvoiceNo && (_.isEmpty(invoice) || invoiceCurrencyId.toString() !== currencyId)) {
      throw new RestError(400, { message: 'Invalid supplied invoice no' });
    }
    if (_.isEmpty(exchangeDetails)) {
      throw new RestError(400, { message: 'Invalid exchange rate' });
    }
    if (!_.isEmpty(invoice) && !_.get(invoice, 'siConnector.isSynced', false)) {
      throw new RestError(400, { message: `Invoice ${invoiceNo} is not synced and can't be adjusted` });
    }
    const currency = _.pick(quote, ['_id', 'isoCode']);
    const localCurrency = _.pick(base, ['_id', 'isoCode']);
    if (_.isEmpty(currency) || _.isEmpty(localCurrency) || quotation <= 0) {
      throw new RestError(400, { message: 'Invalid supplied currency' });
    }
    if (_.isNil(companyId)) {
      throw new RestError(400, { message: 'Invalid supplied company' });
    }
    if (_.isEmpty(contactId)) {
      throw new RestError(400, { message: 'Invalid supplied contact' });
    }
    const entries = invoiceEntries.concat(ownEntries);
    const accountingAmount = entries.reduce((ac, en) => ac.plus(en.amount.toFixed(2)), new Big(0));
    if (accountingAmount <= 0) {
      throw new RestError(400, { message: 'Advance amount should be a positive number' });
    }
    Object.assign(data, {
      accounting: {
        paid: 0,
        currency,
        localCurrency,
        exchangeRate: quotation,
        amount: accountingAmount,
      },
      company: new ObjectId(companyId),
      contact: new ObjectId(contactId),
      lspId: this.lspId,
    });
  }

  _setRoleFilters(query) {
    if (this.user.has(ROLES.READ_COMPANY)) {
      const userCompany = _.get(this.user, 'company.name');
      query.company = new RegExp(_.escapeRegExp(userCompany), 'i');
    } else if (this.user.has(ROLES.READ_OWN)) {
      if (this.user.type === CONTACT_TYPE) {
        query['contactObj._id'] = new ObjectId(this.user._id);
      } else {
        query.createdBy = this.user.email;
      }
    }
  }
}

module.exports = AdjustmentsApi;
