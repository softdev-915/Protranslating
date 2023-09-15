// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { buildPaginationQuery } = require('../../../utils/pagination');
const { startsWithSafeRegexp } = require('../../../utils/regexp');

const { RestError } = apiResponse;

class ServiceTypeAPI extends SchemaAwareAPI {
  _getQueryFilters(filters) {
    let query = { lspId: this.lspId };

    if (_.get(filters, '_id', '')) {
      query._id = filters._id;
    }

    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    return query;
  }

  async getById(id) {
    const serviceType = await this.schema.ServiceType.findOneWithDeleted({
      _id: new mongoose.Types.ObjectId(id), lspId: this.lspId,
    });
    if (_.isEmpty(serviceType)) {
      throw new RestError(404, { message: 'Service type is not found' });
    }
    return serviceType;
  }

  async nameList(params) {
    const query = { lspId: this.lspId };
    const { paginationParams } = params;
    if (_.isString(paginationParams.filter)) {
      const filters = paginationParams.filter;
      if (filters.name) {
        _.assign(query, { name: startsWithSafeRegexp(filters.name) });
      }
    }
    const { limit, skip } = buildPaginationQuery(paginationParams);
    const serviceTypes = await this.schema.ServiceType.findWithDeleted(query)
      .select(params.select)
      .limit(limit)
      .skip(skip)
      .sort({ name: 1 })
      .lean();
    return { list: serviceTypes, total: serviceTypes.length };
  }

  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the service type list`);
    let list = [];
    const query = this._getQueryFilters(filters);
    try {
      list = await this.schema.ServiceType.gridAggregation().exec({
        filters: query,
        utcOffsetInMinutes: filters.__tz,
      });
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error performing service type aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    return {
      list,
      total: list.length,
    };
  }

  async create(serviceType) {
    const defServiceType = {
      name: '',
      lspId: this.lspId,
      createdBy: this.user.email,
    };
    const newServiceType = new this.schema.ServiceType(defServiceType);
    newServiceType.safeAssign(serviceType);
    const serviceTypeCreated = await this._save(newServiceType);
    return serviceTypeCreated;
  }

  async edit(serviceType) {
    const serviceTypeInDb = await this.schema.ServiceType.findOneWithDeleted({
      _id: new mongoose.Types.ObjectId(serviceType._id),
      lspId: this.lspId,
    });

    if (!serviceTypeInDb) {
      throw new RestError(404, { message: 'Service type does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'serviceType',
    });
    await concurrencyReadDateChecker.failIfOldEntity(serviceTypeInDb, serviceType);
    serviceTypeInDb.safeAssign(serviceType);
    const serviceTypeUpdated = await this._save(serviceTypeInDb);
    return serviceTypeUpdated;
  }

  async _save(serviceType) {
    try {
      await serviceType.save();
      return serviceType;
    } catch (err) {
      if (err.message.match(/.*duplicate key*./)) {
        this.logger.debug(`User ${this.user.email} couldn't save the service type: ${serviceType.name} due to err: duplicated key`);
        throw new RestError(409, { message: `Service type ${serviceType.name} already exists` });
      }
      this.logger.debug(`User ${this.user.email} couldn't save the service type: ${serviceType.name} due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }
}

module.exports = ServiceTypeAPI;
