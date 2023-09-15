// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { buildPaginationQuery } = require('../../../utils/pagination');
const { startsWithSafeRegexp } = require('../../../utils/regexp');

const { RestError } = apiResponse;

class DeliveryTypeAPI extends SchemaAwareAPI {
  _getQueryFilters(filters) {
    let query = { lspId: this.lspId };

    if (_.get(filters, '_id', '')) {
      query._id = filters._id;
    }

    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    return query;
  }

  async getById(id) {
    const deliveryType = await this.schema.DeliveryType.findOneWithDeleted({
      _id: new mongoose.Types.ObjectId(id), lspId: this.lspId,
    });
    if (_.isEmpty(deliveryType)) {
      throw new RestError(404, { message: 'Delivery type is not found' });
    }
    return deliveryType;
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
    const deliveryTypes = await this.schema.DeliveryType.findWithDeleted(query)
      .select(params.select)
      .limit(limit)
      .skip(skip)
      .sort({ name: 1 })
      .lean();
    return { list: deliveryTypes, total: deliveryTypes.length };
  }

  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the delivery type list`);
    let list = [];
    const query = this._getQueryFilters(filters);
    try {
      list = await this.schema.DeliveryType.gridAggregation().exec({
        filters: query,
        utcOffsetInMinutes: filters.__tz,
      });
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error performing delivery type aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    return {
      list,
      total: list.length,
    };
  }

  async create(deliveryType) {
    const defDeliveryType = {
      name: '',
      lspId: this.lspId,
      createdBy: this.user.email,
    };
    const newDeliveryType = new this.schema.DeliveryType(defDeliveryType);
    newDeliveryType.safeAssign(deliveryType);
    const deliveryTypeCreated = await this._save(newDeliveryType);
    return deliveryTypeCreated;
  }

  async edit(deliveryType) {
    const deliveryTypeInDb = await this.schema.DeliveryType.findOneWithDeleted({
      _id: new mongoose.Types.ObjectId(deliveryType._id),
      lspId: this.lspId,
    });

    if (!deliveryTypeInDb) {
      throw new RestError(404, { message: 'Delivery type does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'deliveryType',
    });
    await concurrencyReadDateChecker.failIfOldEntity(deliveryTypeInDb, deliveryType);
    deliveryTypeInDb.safeAssign(deliveryType);
    const deliveryTypeUpdated = await this._save(deliveryTypeInDb);
    return deliveryTypeUpdated;
  }

  async _save(deliveryType) {
    try {
      await deliveryType.save();
      return deliveryType;
    } catch (err) {
      if (err.message.match(/.*duplicate key*./)) {
        this.logger.debug(`User ${this.user.email} couldn't save the delivery type: ${deliveryType.name} due to err: duplicated key`);
        throw new RestError(409, { message: `Delivery type ${deliveryType.name} with the same service type already exists` });
      }
      this.logger.debug(`User ${this.user.email} couldn't save the delivery type: ${deliveryType.name} due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }
}

module.exports = DeliveryTypeAPI;
