// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { exportFactory, searchFactory } = require('../../../utils/pagination');
const { CsvExport } = require('../../../utils/csvExporter');
const { validObjectId } = require('../../../utils/schema');

const { RestError } = apiResponse;

class CompanyExternalAccountingCodeAPI extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.logger = logger;
    this.configuration = _.get(options, 'configuration');
  }

  _getQueryFilters(filters) {
    let query = { lspId: this.lspId };

    if (filters && filters._id) {
      query._id = filters._id;
    }

    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    const pipeline = [{
      $addFields: {
        companyName: '$company.name',
      },
    }];
    const extraQueryParams = ['companyName'];
    return {
      query,
      pipeline,
      extraQueryParams,
    };
  }

  /**
   * Returns the company external accounting code list as a csv file
   * @param {Object} CompanyExternalAccountingCode to filter the groups returned.
   */
  async companyExternalAccountingCodeExport(filters) {
    const queryFilters = this._getQueryFilters(filters);
    const cursor = await exportFactory(
      this.schema.CompanyExternalAccountingCode,
      queryFilters.query,
      queryFilters.pipeline,
      queryFilters.extraQueryParams,
      filters.__tz,
    );
    const csvExporter = new CsvExport(cursor, {
      schema: this.schema.CompanyExternalAccountingCode,
      lspId: this.lspId,
      configuration: this.configuration,
      logger: this.logger,
      filters: queryFilters.query,
    });
    return csvExporter.export();
  }

  /**
   * Returns the company external accounting code list
   * @param {Object} CompanyExternalAccountingCode
   * to filter the company external accounting code returned.
   * @param {String} CompanyExternalAccountingCode.id
   * the company external accounting code id to filter.
   */
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the company external accounting code list`);
    let list = [];
    const queryFilters = this._getQueryFilters(filters);
    list = await searchFactory({
      model: this.schema.CompanyExternalAccountingCode,
      filters: queryFilters.query,
      extraPipelines: queryFilters.pipeline,
      extraQueryParams: queryFilters.extraQueryParams,
      utcOffsetInMinutes: filters.__tz,
    });
    return {
      list,
      total: list.length,
    };
  }

  async retrieveById(companyExternalAccountingCodeId) {
    if (!validObjectId(companyExternalAccountingCodeId)) {
      throw new RestError(400, { message: 'Invalid ObjectId' });
    }
    const companyExternalAccountingCode = await this.schema.CompanyExternalAccountingCode
      .findOneWithDeleted({
        _id: companyExternalAccountingCodeId,
        lspId: this.lspId,
      });
    if (_.isNil(companyExternalAccountingCode)) {
      throw new RestError(404, {
        message: `Company External Accounting Code with _id ${companyExternalAccountingCodeId} was not found`,
      });
    }
    return companyExternalAccountingCode;
  }

  async create(companyExtAccountingCode) {
    const companyExternalAccountingCodeDB = await this.schema.CompanyExternalAccountingCode
      .findOneWithDeleted({
        company: companyExtAccountingCode.company,
        companyExternalAccountingCode: companyExtAccountingCode.companyExternalAccountingCode,
      });
    if (!_.isNil(companyExternalAccountingCodeDB)) {
      throw new RestError(409, {
        message: `Duplicated Company External Accounting Code combination. Please enter a unique combination. Company External Accounting Code ID ${companyExternalAccountingCodeDB._id} already exists`,
      });
    }
    const defExternalAccountingCode = {
      name: '',
      lspId: this.lspId,
    };
    const newCompanyExternalAccountingCode = new this.schema.CompanyExternalAccountingCode(
      defExternalAccountingCode,
    );
    newCompanyExternalAccountingCode.safeAssign(companyExtAccountingCode);
    await this._save(newCompanyExternalAccountingCode);
    return newCompanyExternalAccountingCode;
  }

  async update(companyExternalAccountingCode) {
    const _id = new mongoose.Types.ObjectId(companyExternalAccountingCode._id);
    const companyExternalAccountingCodeInDB = await this.schema.CompanyExternalAccountingCode.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (!companyExternalAccountingCodeInDB) {
      throw new RestError(404, { message: 'Company External Accounting Code does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'companyExternalAccountingCode',
    });
    await concurrencyReadDateChecker.failIfOldEntity(companyExternalAccountingCodeInDB);
    companyExternalAccountingCodeInDB.safeAssign(companyExternalAccountingCode);
    this._save(companyExternalAccountingCodeInDB);
    return companyExternalAccountingCodeInDB;
  }

  async _save(companyExternalAccountingCode) {
    try {
      await companyExternalAccountingCode.save();
    } catch (err) {
      if (err.message.match(/.*duplicate key*./)) {
        this.logger.debug(`User ${this.user.email} couldn't save the companyExternalAccountingCode: ${companyExternalAccountingCode._id} due to err: duplicated key`);
        throw new RestError(409, { message: `Duplicated Company External Accounting Code combination. Please enter a unique combination. Company External Accounting Code ID ${companyExternalAccountingCode._id} already exists` });
      }
      this.logger.debug(`User ${this.user.email} couldn't save the companyExternalAccountingCode: ${companyExternalAccountingCode._id} due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }
}

module.exports = CompanyExternalAccountingCodeAPI;
