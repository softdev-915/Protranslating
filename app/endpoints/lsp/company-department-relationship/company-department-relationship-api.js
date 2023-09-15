const mongoose = require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { exportFactory, searchFactory } = require('../../../utils/pagination');
const { CsvExport } = require('../../../utils/csvExporter');
const { validObjectId } = require('../../../utils/schema');

const { RestError } = apiResponse;

class CompanyDepartmentRelationshipAPI extends SchemaAwareAPI {
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
      $lookup: {
        from: 'companies',
        localField: 'company',
        foreignField: '_id',
        as: 'company',
      },
    }, {
      $lookup: {
        from: 'internalDepartments',
        localField: 'internalDepartment',
        foreignField: '_id',
        as: 'internalDepartment',
      },
    }, {
      $addFields: {
        companyName: '$company.name',
        internalDepartmentName: '$internalDepartment.name',
      },
    }, {
      $addFields: {
        company: { $arrayElemAt: ['$company', 0] },
        internalDepartment: { $arrayElemAt: ['$internalDepartment', 0] },
        internalDepartmentName: { $arrayElemAt: ['$internalDepartmentName', 0] },
        companyName: { $arrayElemAt: ['$companyName', 0] },
      },
    }];
    const extraQueryParams = ['companyName', 'internalDepartmentName'];
    return {
      query,
      pipeline,
      extraQueryParams,
    };
  }

  /**
   * Returns the company department relationship list as a csv file
   * @param {Object} CompanyDepartmentRelationship to filter the groups returned.
   */
  async companyDepartmentRelationshipExport(filters) {
    const queryFilters = this._getQueryFilters();

    try {
      const cursor = await exportFactory(
        this.schema.CompanyDepartmentRelationship,
        queryFilters.query,
        queryFilters.pipeline,
        queryFilters.extraQueryParams,
        filters.__tz,
      );
      const csvExporter = new CsvExport(cursor, {
        schema: this.schema.CompanyDepartmentRelationship,
        lspId: this.lspId,
        configuration: this.configuration,
        logger: this.logger,
        filters: queryFilters.query,
      });
      return csvExporter.export();
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error exporting data. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
  }

  /**
   * Returns the company department relationship list
   * @param {Object} CompanyDepartmentRelationship
   * to filter the company department relationships returned.
   * @param {String} CompanyDepartmentRelationship.id
   * the company department relationship id to filter.
   */
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the company department relationship list`);
    let list = [];
    const queryFilters = this._getQueryFilters(filters);

    try {
      list = await searchFactory({
        model: this.schema.CompanyDepartmentRelationship,
        filters: queryFilters.query,
        extraPipelines: queryFilters.pipeline,
        extraQueryParams: queryFilters.extraQueryParams,
        utcOffsetInMinutes: filters.__tz,
      });
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error performing aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    return {
      list,
      total: list.length,
    };
  }

  async retrieveById(companyDepartmentRelationshipId) {
    if (!validObjectId(companyDepartmentRelationshipId)) {
      throw new RestError(400, { message: 'Invalid ObjectId' });
    }
    const companyDepartmentRelationship = await this.schema.CompanyDepartmentRelationship
      .findOneWithDeleted({
        _id: companyDepartmentRelationshipId,
        lspId: this.lspId,
      }).populate('company');

    if (_.isNil(companyDepartmentRelationship)) {
      throw new RestError(404, {
        message: `Company Department Relationship with _id ${companyDepartmentRelationshipId} was not found`,
      });
    }
    return companyDepartmentRelationship;
  }

  async create(companyDepartmentRelationship) {
    const companyDepartmentRelationshipDB = await this.schema.CompanyDepartmentRelationship
      .findOneWithDeleted({
        company: companyDepartmentRelationship.company,
        internalDepartment: companyDepartmentRelationship.internalDepartment,
      });
    if (!_.isNil(companyDepartmentRelationshipDB)) {
      throw new RestError(409, {
        message: `Duplicated Company Department relationship combination. Please enter a unique combination. Company Department Relationship ID ${companyDepartmentRelationshipDB._id} already exists`,
      });
    }
    delete companyDepartmentRelationship._id;
    const defCompanyDepartmentRelationship = {
      name: '',
      lspId: this.lspId,
      createdBy: this.user.email,
    };
    const newCompanyDepartmentRelationship = new this.schema
      .CompanyDepartmentRelationship(defCompanyDepartmentRelationship);
    newCompanyDepartmentRelationship.safeAssign(companyDepartmentRelationship);
    const companyDepartmentRelationshipCreated = await newCompanyDepartmentRelationship.save();
    return companyDepartmentRelationshipCreated;
  }

  async update(companyDepartmentRelationship) {
    const _id = new mongoose.Types.ObjectId(companyDepartmentRelationship._id);
    const companyDepartmentRelationshipInDB = await this.schema.CompanyDepartmentRelationship.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (!companyDepartmentRelationshipInDB) {
      throw new RestError(404, { message: 'Company Department Relationship does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'companyDepartmentRelationship',
    });
    await concurrencyReadDateChecker.failIfOldEntity(companyDepartmentRelationshipInDB);
    companyDepartmentRelationshipInDB.safeAssign(companyDepartmentRelationship);
    companyDepartmentRelationshipInDB.deleted = _.get(companyDepartmentRelationshipInDB, 'deleted', false);
    try {
      const companyDepartmentRelationshipUpdated = await companyDepartmentRelationshipInDB.save(companyDepartmentRelationship);
      await companyDepartmentRelationshipUpdated.populate({ path: 'company', select: 'name _id' });
      return companyDepartmentRelationshipUpdated;
    } catch (err) {
      if (err.message.match(/.*duplicate key*./)) {
        this.logger.debug(`User ${this.user.email} couldn't save the companyDepartmentRelationship: ${companyDepartmentRelationship._id} due to err: duplicated key`);
        throw new RestError(409, { message: `Duplicated Company Department relationship combination. Please enter a unique combination. Company Department Relationship ID ${companyDepartmentRelationship._id} already exists` });
      }
      this.logger.debug(`User ${this.user.email} couldn't save the companyDepartmentRelationship: ${companyDepartmentRelationship._id} due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }
}

module.exports = CompanyDepartmentRelationshipAPI;
