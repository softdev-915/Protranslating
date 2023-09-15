const _ = require('lodash');
const { Types: { ObjectId } } = require('mongoose');
const { RestError } = require('../../../components/api-response');
const SchemasAwareApi = require('../../schema-aware-api');
const { searchFactory, exportFactory } = require('../../../utils/pagination');
const { CsvExport } = require('../../../utils/csvExporter');
const CloudStorage = require('../../../components/cloud-storage');
const SiConnectorAPI = require('../../../connectors/si/si-connector-api');
const assignAttachmentManagementMethods = require('../../../utils/attachments');
const { ensureNumber } = require('../../../utils/bigjs');
const { provideTransaction } = require('../../../components/database/mongo/utils');

class AdvanceApi extends SchemasAwareApi {
  constructor(logger, options) {
    super(logger, { ...options });
    this.configuration = _.get(options, 'configuration');
    this.cloudStorage = new CloudStorage(this.configuration);
    assignAttachmentManagementMethods(this, this.schema.ArAdvance);
  }

  _getQueryFilters(filters) {
    const { lspId } = this;
    const query = { lspId, ..._.get(filters, 'paginationParams', {}) };
    return query;
  }

  _getExtraPipelines(timezoneValue) {
    const diffMinutes = parseInt(timezoneValue, 10);
    return [
      {
        $lookup: {
          from: 'bankAccounts',
          localField: 'bankAccount',
          foreignField: '_id',
          as: 'bankAccount',
        },
      },
      {
        $lookup: {
          from: 'paymentMethods',
          localField: 'paymentMethod',
          foreignField: '_id',
          as: 'paymentMethod',
        },
      },
      {
        $unwind: {
          path: '$bankAccount',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: { path: '$paymentMethod' },
      },
      {
        $addFields: {
          account: {
            $toString: {
              $ifNull: ['$bankAccount.name', '$undepositedAccountIdentifier'],
            },
          },
          paymentMethod: '$paymentMethod.name',
          amount: { $toString: '$accounting.amount' },
          applied: { $toString: '$accounting.paid' },
          balance: { $toString: '$accounting.balance' },
          currency: '$accounting.currency.isoCode',
          localCurrency: '$accounting.localCurrency.isoCode',
          localAmount: { $toString: '$accounting.amountInLocal' },
          exchangeRate: { $toString: '$accounting.exchangeRate' },
          isSynced: { $toString: '$siConnector.isSynced' },
          syncError: '$siConnector.syncError',
          lastSyncDate: _.isNaN(diffMinutes)
            ? '$siConnector.connectorEndedAt'
            : { $add: ['$siConnector.connectorEndedAt', diffMinutes * 60 * 1000] },
        },
      },
      {
        $project: {
          _id: 1,
          account: 1,
          no: 1,
          status: 1,
          date: 1,
          receiptDate: 1,
          company: 1,
          amount: 1,
          applied: 1,
          balance: 1,
          paymentMethod: 1,
          description: 1,
          docNo: 1,
          currency: 1,
          lastSyncDate: 1,
          localCurrency: 1,
          localAmount: 1,
          exchangeRate: 1,
          appliedTo: 1,
          updatedBy: 1,
          createdBy: 1,
          deletedBy: 1,
          restoredBy: 1,
          deletedAt: 1,
          restoredAt: 1,
          createdAt: 1,
          updatedAt: 1,
          isSynced: 1,
          syncError: 1,
        },
      },
    ];
  }

  _getBeforeMatchPipeline() {
    return [
      {
        $lookup: {
          from: 'companies',
          localField: 'company',
          foreignField: '_id',
          as: 'company',
        },
      },
      {
        $addFields: {
          company: '$company.hierarchy',
        },
      }];
  }

  _getExtraQueryParams() {
    return ['account', 'paymentMethod', 'company', 'amount', 'applied', 'balance',
      'currency', 'lastSyncDate', 'localAmount', 'exchangeRate', 'localCurrency', 'isSynced', 'syncError'];
  }

  async export(filters) {
    const query = this._getQueryFilters(filters);
    const extraQueryParams = this._getExtraQueryParams();
    const extraPipelines = this._getExtraPipelines(filters.__tz);
    const queryObj = await exportFactory(
      this.schema.ArAdvance,
      query,
      extraPipelines,
      extraQueryParams,
      filters.__tz,
      this._getBeforeMatchPipeline(),
    );
    const csvExporter = new CsvExport(queryObj, {
      schema: this.schema.ArAdvance,
      lspId: this.lspId,
      logger: this.logger,
      configuration: this.configuration,
    });
    return csvExporter.export();
  }

  async list(filters) {
    let list = [];
    const query = this._getQueryFilters(filters);

    if (!this.user.has('AR-PAYMENT_READ_ALL')) {
      this._setRoleFilters(query);
    }
    const extraQueryParams = this._getExtraQueryParams();
    const extraPipelines = this._getExtraPipelines(filters.__tz);

    try {
      list = await searchFactory({
        model: this.schema.ArAdvance,
        filters: query,
        extraPipelines,
        extraQueryParams,
        utcOffsetInMinutes: filters.__tz,
        beforeMatchPipeline: this._getBeforeMatchPipeline(),
      });
    } catch (err) {
      this.logger.error(`Error retrieving ar advances list: ${err}`);
      throw new RestError(500, err);
    }
    return { list, total: list.length };
  }

  async create(advanceData) {
    try {
      this.logger.debug(`Ar advance: ${this.user.email} triggered advance creation`);
      await this._populateAdvanceData(advanceData);
      const newAdvance = new this.schema.ArAdvance(advanceData);

      await this.provideTransaction(async (session) => {
        this.logger.debug(`Ar advance: ${this.user.email} created advance model ${_.get(newAdvance, '_id')}`);
        await this.schema.Company.lockCompanyHierarchy(newAdvance.company, session);
        this.logger.debug(`Ar advance: ${this.user.email} locked company hierarchy`);
        const { financialEntityPrefix } = await this.schema.Lsp.findById(this.lspId, 'financialEntityPrefix');

        if (_.isNil(financialEntityPrefix)) {
          throw new RestError(400, { message: 'Financial Entity Prefix must be specified in the lsp settings' });
        }
        this.logger.debug(`Ar advance: ${this.user.email} started saving advance model`);
        newAdvance.setAccountingDetails();
        await this.schema.ArAdvance.setNo(newAdvance, session);
        await newAdvance.save({ session });
        this.logger.debug(`Ar advance: ${this.user.email}. Consolidating balance for company ${newAdvance.company}`);
        await this.schema.Company.consolidateBalance(newAdvance.company, session);
        this.logger.debug(`Ar advance: ${this.user.email}. Finished consolidate balance for company ${newAdvance.company}`);
      }, undefined, `Ar advance: ${this.user.email}`);
      this.logger.debug(`Ar advance: ${this.user.email}. Started to sync advance ${_.get(newAdvance, '_id')}`);
      (new SiConnectorAPI(this.flags)).syncArAdvances({ _id: newAdvance._id })
        .catch((e) => this.logger.error(e));
      return newAdvance.toObject();
    } catch (err) {
      this.logger.error(`Ar advance: Failed to create advance. User is: ${this.user.email}. ${err}`);
      throw new Error(`Ar advance: Failed to create advance: ${err}`);
    }
  }

  async edit(data) {
    await this._populateAdvanceData(data);
    const advanceToEdit = await this.schema.ArAdvance.findOne({ _id: data._id });

    if (_.isNil(advanceToEdit)) {
      throw new RestError(500, { message: `Advance with _id ${data._id} not found` });
    }
    if (_.get(advanceToEdit, 'siConnector.isSynced')) {
      throw new RestError(500, { message: `Advance with _id ${data._id} is synced and can't be updated` });
    }
    _.assign(advanceToEdit, data);
    advanceToEdit.setAccountingDetails();
    await advanceToEdit.save();
    const updatedAdvance = await this.getById(advanceToEdit._id);

    (new SiConnectorAPI(this.flags)).syncArAdvances({ _id: advanceToEdit._id })
      .catch((e) => this.logger.error(e));
    return updatedAdvance;
  }

  async getById(id) {
    const advance = await this.schema.ArAdvance
      .findOne({ _id: new ObjectId(id), lspId: this.lspId })
      .populate({ path: 'paymentMethod', select: 'name', options: { withDeleted: true, lean: true } })
      .populate({ path: 'bankAccount', select: 'name no', options: { withDeleted: true, lean: true } })
      .populate({ path: 'company', select: 'name hierarchy status', options: { withDeleted: true, lean: true } })
      .exec();

    if (_.isNil(advance)) {
      throw new RestError(404, { message: 'Advance is not found' });
    }
    return advance.toObject();
  }

  async _populateAdvanceData(data) {
    this.logger.debug(`Ar advance: ${this.user.email}. Starting _populateAdvanceData`);
    const { accounting, bankAccount } = data;
    const { amount } = accounting;
    const { currencyId } = accounting;
    const exchangeDetails = await this.schema.Lsp.getExchangeDetails(this.lspId, currencyId);
    this.logger.debug(`Ar advance: ${this.user.email}. _populateAdvanceData got exchange details`);
    const { quote: currency, base: localCurrency, quotation: exchangeRate } = exchangeDetails;

    if (_.isNil(data.company)) {
      throw new RestError(400, { message: 'Invalid supplied company' });
    }
    if (_.isEmpty(currency) || _.isEmpty(localCurrency) || exchangeRate <= 0) {
      throw new RestError(400, { message: 'Invalid supplied currency' });
    }
    if (amount <= 0) {
      throw new RestError(400, { message: 'Advance amount should be a positive number' });
    }
    if (_.isEmpty(bankAccount)) {
      delete data.bankAccount;
      await this._assignUndepositedAccountIdentifier(data);
      this.logger.debug(`Ar advance: ${this.user.email}. _populateAdvanceData assigned Undeposited Account Identifier`);
    }
    Object.assign(data, {
      lspId: this.lspId,
      accounting: {
        exchangeRate,
        currency: _.pick(currency, ['_id', 'isoCode']),
        localCurrency: _.pick(localCurrency, ['_id', 'isoCode']),
        amount: ensureNumber(amount).toFixed(2),
      },
    });
  }

  _setRoleFilters(query) {
    if (this.user.has('AR-PAYMENT_READ_COMPANY')) {
      const userCompany = _.get(this.user, 'company.name');

      query.company = new RegExp(_.escapeRegExp(userCompany), 'i');
    } else if (this.user.has('AR-PAYMENT_READ_OWN')) {
      query.createdBy = this.user.email;
    }
  }

  async _assignUndepositedAccountIdentifier(payment) {
    const lsp = await this.schema.Lsp.findOne({ _id: this.lspId });
    const identifier = _.get(lsp, 'paymentGateway.account');

    if (_.isNil(identifier)) {
      throw new RestError(400, { message: 'No bank account seleted' });
    }
    payment.undepositedAccountIdentifier = identifier;
  }

  async void(_id, details) {
    _id = new ObjectId(_id);
    await provideTransaction(async (session) => {
      const advance = await this.schema.ArAdvance.findOne({ _id }).session(session);

      await this.schema.Company.lockCompanyHierarchy(advance.company, session);
      if (advance.accounting.paid !== 0) {
        throw new RestError(400, { message: `Can't void an advance because it has been applied to ${advance.appliedTo}` });
      }
      await advance.void(session, details);
      await this.schema.Company.consolidateBalance(advance.company, session);
      await (new SiConnectorAPI(this.flags)).voidArAdvance(_id, session);
    });
    return this.schema.ArAdvance.findOne({ _id }).lean();
  }
}

module.exports = AdvanceApi;
