const mongoose = require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');

const { RestError } = apiResponse;

class PaymentMethodAPI extends SchemaAwareAPI {
  _getQueryFilters(filters) {
    let query = { lspId: this.lspId };

    if (filters && filters._id) {
      query._id = filters._id;
    }

    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    return query;
  }

  /** Returns a csv file
   * @param {String} filters.id the payment methods id to filter.
   */
  async paymentMethodExport(filters) {
    const query = this._getQueryFilters(filters);
    let csvStream;

    try {
      csvStream = this.schema.PaymentMethod.gridAggregation().csvStream({
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

  /**
   * Returns the payment's form list
   * @param {Object} user Current user making the query
   * @param {String} filters.id the payment methods id to filter.
   */
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the payment's form list`);
    let list = [];
    const queryFilters = this._getQueryFilters(filters);

    // Search specific payment method
    if (queryFilters._id) {
      list = await this.schema.PaymentMethod.findWithDeleted({
        _id: filters._id,
        lspId: this.lspId,
      });
    } else {
      try {
        list = await this.schema.PaymentMethod.gridAggregation().exec({
          filters: queryFilters,
          utcOffsetInMinutes: filters.__tz,
        });
      } catch (err) {
        const message = err.message || err;

        this.logger.error(`Error performing payment method aggregation. Error: ${message}`);
        throw new RestError(500, { message: err, stack: err.stack });
      }
    }
    return {
      list,
      total: list.length,
    };
  }

  async create(paymentMethod) {
    delete paymentMethod._id;
    const defPaymentMethod = {
      name: '',
      lspId: this.lspId,
      createdBy: this.user.email,
    };
    const newPaymentMethod = new this.schema.PaymentMethod(defPaymentMethod);

    newPaymentMethod.safeAssign(paymentMethod);
    const paymentMethodInDb = await this.schema.PaymentMethod.findOneWithDeleted({
      name: paymentMethod.name,
      lspId: this.lspId,
    });

    if (!_.isNil(paymentMethodInDb)) {
      throw new RestError(409, { message: 'Payment method already exists' });
    }
    const paymentMethodCreated = await newPaymentMethod.save();
    return paymentMethodCreated;
  }

  async update(paymentMethod) {
    const _id = new mongoose.Types.ObjectId(paymentMethod._id);
    const paymentMethodInDb = await this.schema.PaymentMethod.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (!paymentMethodInDb) {
      throw new RestError(404, { message: 'Payment method does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'paymentMethod',
    });
    await concurrencyReadDateChecker.failIfOldEntity(paymentMethodInDb);

    paymentMethodInDb.safeAssign(paymentMethod);

    paymentMethodInDb.deleted = _.get(paymentMethodInDb, 'deleted', false);
    try {
      const updatedPaymentMethod = await paymentMethodInDb.save(paymentMethod);
      return updatedPaymentMethod;
    } catch (err) {
      if (err.message.match(/.*duplicate key*./)) {
        this.logger.debug(`User ${this.user.email} couldn't save the paymentMethod: ${paymentMethod.name} due to err: duplicated key`);
        throw new RestError(409, { message: `Payment method ${paymentMethod.name} already exists` });
      }
      this.logger.debug(`User ${this.user.email} couldn't save the paymentMethod: ${paymentMethod.name} due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }
}

module.exports = PaymentMethodAPI;
