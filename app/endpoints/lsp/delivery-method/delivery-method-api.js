const mongoose = require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { validObjectId } = require('../../../utils/schema');

const { RestError } = apiResponse;

class DeliveryMethodApi extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.configuration = _.get(options, 'configuration');
  }

  _getQueryFilters(filters) {
    let query = {};

    if (filters && filters._id) {
      query._id = filters._id;
    }

    query = Object.assign(query, {
      lspId: this.lspId,
    }, _.get(filters, 'paginationParams', {}));
    return query;
  }

  /**
   * Returns the delivery method list
   * @param {Object} deliveryMethodFilters to filter the delivery method returned.
   * @param {String} deliveryMethodFilters.id the delivery method's id to filter.
   */
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the Delivery Method list`);
    let list = [];
    const query = this._getQueryFilters(filters);

    // Search specific delivery method
    try {
      list = await this.schema.DeliveryMethod.gridAggregation().exec({
        filters: query,
        utcOffsetInMinutes: filters.__tz,
      });
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error performing language aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    return {
      list,
      total: list.length,
    };
  }

  async retrieveById(deliveryMethodId) {
    if (!validObjectId(deliveryMethodId)) {
      throw new RestError(400, { message: 'Invalid ObjectId' });
    }
    const deliveryMethod = await this.schema.DeliveryMethod.findOneWithDeleted({
      _id: deliveryMethodId,
      lspId: this.lspId,
    });

    if (!deliveryMethod) {
      throw new RestError(404, { message: `Delivery Method with _id ${deliveryMethodId} was not found` });
    }
    return deliveryMethod;
  }

  /**
   * Returns the delivery method list as a csv file
   * @param {Object} deliveryMethodFilters to filter the groups returned.
   */
  async deliveryMethodExport(filters) {
    let csvStream;
    const queryFilters = this._getQueryFilters(filters);

    try {
      csvStream = this.schema.DeliveryMethod.gridAggregation().csvStream({
        filters: queryFilters,
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

  async create(deliveryMethod) {
    delete deliveryMethod._id;
    deliveryMethod.lspId = this.lspId;
    const newDeliveryMethod = new this.schema.DeliveryMethod(deliveryMethod);

    newDeliveryMethod.safeAssign(deliveryMethod);

    const deliveryMethodInDb = await this.schema.DeliveryMethod.findOneWithDeleted({
      name: deliveryMethod.name,
      lspId: this.lspId,
    });

    if (!_.isNil(deliveryMethodInDb)) {
      throw new RestError(409, { message: 'Delivery Method already exists' });
    }
    const createdDeliveryMethod = await newDeliveryMethod.save();
    return createdDeliveryMethod;
  }

  async update(deliveryMethod) {
    if (!validObjectId(deliveryMethod._id)) {
      throw new RestError(400, { message: 'Invalid ObjectId' });
    }
    const _id = new mongoose.Types.ObjectId(deliveryMethod._id);
    const deliveryMethodInDb = await this.schema.DeliveryMethod.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (!deliveryMethodInDb) {
      throw new RestError(404, { message: 'Delivery Method does not exist' });
    }
    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'deliveryMethod',
    });
    await concurrencyReadDateChecker.failIfOldEntity(deliveryMethodInDb);
    deliveryMethodInDb.safeAssign(deliveryMethod);
    try {
      const deliveryMethodUpdated = await deliveryMethodInDb.save(deliveryMethod);
      return deliveryMethodUpdated;
    } catch (err) {
      this.logger.debug(`Error ocurred upon saving new delivery method: ${err.message}`);
      if (err.message.match('duplicate')) {
        throw new RestError(500, { message: `${deliveryMethod.name} already exists` });
      }
      throw new RestError(500, { message: 'Error ocurred upon saving new delivery rethod' });
    }
  }
}

module.exports = DeliveryMethodApi;
