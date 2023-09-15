const mongoose = require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');

const { RestError } = apiResponse;

class RequestTypeApi extends SchemaAwareAPI {
  /**
   * @param {Object} logger
   * @param {Object} options optional object.
   * @param {Object} options.configuration configuration.
   * @param {Object} options.user user that is user api.
   */
  constructor(logger, options) {
    super(logger, options);
    this.configuration = _.get(options, 'configuration');
  }

  _getRequestTypeQuery(filters) {
    const query = {
      lspId: this.lspId,
    };

    if (filters) {
      if (filters._id) {
        query._id = filters._id;
      }
    }
    return Object.assign(query, _.get(filters, 'paginationParams', {}));
  }

  async detail(requestTypeId) {
    const requestType = await this.schema.RequestType.findOneWithDeleted({
      _id: requestTypeId,
      lspId: this.lspId,
    });

    if (!requestType) {
      throw new RestError(404, { message: `Request Type ${requestTypeId} does not exist` });
    }
    return requestType;
  }

  /**
   * Returns the requestType list
   * @param {Object} requestTypeFilters to filter the requestTypes returned.
   * @param {String} requestTypeFilters.id the requestType id to filter.
   */
  async requestTypeList(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the requestType list`);
    let list = [];
    const query = this._getRequestTypeQuery(filters);

    // Search specific requestType
    try {
      list = await this.schema.RequestType.gridAggregation().exec({
        filters: query,
        utcOffsetInMinutes: filters.__tz,
      });
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error performing requestType aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    return {
      list,
      total: list.length,
    };
  }

  /**
   * Returns the requestType list as a csv file
   * @param {Object} requestTypeFilters to filter the requestTypes returned.
   */
  async requestTypeExport(filters) {
    let csvStream;
    const query = this._getRequestTypeQuery(filters);

    try {
      csvStream = this.schema.RequestType.gridAggregation().csvStream({
        filters: query,
        utcOffsetInMinutes: filters.__tz,
        shouldPaginate: false,
      });
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error transforming to csv. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    return csvStream;
  }

  async create(requestType) {
    delete requestType._id;
    const defRequestType = {
      name: '',
      lspId: this.lspId,
    };
    const newRequestType = new this.schema.RequestType(defRequestType);

    newRequestType.safeAssign(requestType);
    const requestTypeInDb = await this.schema.RequestType.findOneWithDeleted({
      name: requestType.name,
      lspId: this.lspId,
    });

    if (!_.isNil(requestTypeInDb)) {
      throw new RestError(404, { message: 'RequestType does not exist' });
    }
    await this._save(newRequestType);
    return newRequestType;
  }

  async update(requestType) {
    const _id = new mongoose.Types.ObjectId(requestType._id);
    const requestTypeInDb = await this.schema.RequestType.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (!requestTypeInDb) {
      throw new RestError(404, { message: 'RequestType does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'requestType',
    });
    await concurrencyReadDateChecker.failIfOldEntity(requestTypeInDb);
    requestTypeInDb.safeAssign(requestType);
    const modifications = requestTypeInDb.getModifications();

    requestTypeInDb.deleted = _.isBoolean(requestType.deleted) ? requestType.deleted : false;
    try {
      const updatedRequestType = await requestTypeInDb.save(requestType);

      await this.schema.RequestType.postSave(requestType, modifications);
      return updatedRequestType;
    } catch (e) {
      const message = e.message || e;

      if (/^Duplicated request type.*/.test(e.message)) {
        throw new RestError(409, { message });
      }
      throw e;
    }
  }
}

module.exports = RequestTypeApi;
