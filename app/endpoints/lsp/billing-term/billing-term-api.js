const mongoose = require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');

const { RestError } = apiResponse;

class BillingTermAPI extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.configuration = _.get(options, 'configuration');
  }

  _getQueryFilters(filters) {
    let query = { lspId: this.lspId };

    if (filters) {
      if (filters._id) {
        query._id = filters._id;
      }
    }

    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    return query;
  }

  /**
   * Returns the billing terms list as a csv file
   * @param {Object} billingTermsFilters to filter the groups returned.
   */
  async billingTermExport(filters) {
    let csvStream;
    const query = this._getQueryFilters(filters);

    try {
      csvStream = this.schema.BillingTerm.gridAggregation().csvStream({
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
   * Returns the billing's term list
   * @param {Object} user current user making the query
   * @param {String} billingTermFilters.id the billing term's id to filter.
  */
  async list(filters) {
    const { lspId } = this;

    this.logger.debug(`User ${this.user.email} retrieved the billing's term list`);
    let list = [];
    const query = this._getQueryFilters(filters);

    // Search specific billing term
    if (filters._id) {
      list = await this.schema.BillingTerm.findWithDeleted({
        _id: filters._id,
        lspId,
      });
    } else {
      try {
        list = await this.schema.BillingTerm.gridAggregation().exec({
          filters: query,
          utcOffsetInMinutes: filters.__tz,
        });
      } catch (err) {
        const message = err.message || err;

        this.logger.error(`Error performing language aggregation. Error: ${message}`);
        throw new RestError(500, { message: err, stack: err.stack });
      }
    }
    return {
      list,
      total: list.length,
    };
  }

  async create(billingTerm) {
    delete billingTerm._id;
    const defBillingTerm = {
      name: '',
      lspId: this.lspId,
      createdBy: this.user.email,
    };
    const newBillingTerm = new this.schema.BillingTerm(defBillingTerm);

    newBillingTerm.safeAssign(billingTerm);
    const billingTermInDb = await this.schema.BillingTerm.findOneWithDeleted({
      name: billingTerm.name,
      lspId: this.lspId,
    });

    if (!_.isNil(billingTermInDb)) {
      throw new RestError(409, { message: 'Billing term already exists' });
    }
    const billingTermCreated = await newBillingTerm.save();
    return billingTermCreated;
  }

  async update(billingTerm) {
    const _id = new mongoose.Types.ObjectId(billingTerm._id);
    const billingTermInDb = await this.schema.BillingTerm.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (!billingTermInDb) {
      throw new RestError(404, { message: 'Billing term does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'billingTerm',
    });
    await concurrencyReadDateChecker.failIfOldEntity(billingTermInDb);

    billingTermInDb.safeAssign(billingTerm);

    billingTermInDb.deleted = _.get(billingTermInDb, 'deleted', false);
    try {
      const billingTermUpdated = await billingTermInDb.save(billingTerm);
      return billingTermUpdated;
    } catch (err) {
      if (err.message.match(/.*duplicate key*./)) {
        this.logger.debug(`User ${this.user.email} couldn't save the billingTerm: ${billingTerm.name} due to err: duplicated key`);
        throw new RestError(409, { message: `Billing term ${billingTerm.name} already exists` });
      }
      this.logger.debug(`User ${this.user.email} couldn't save the billingTerm: ${billingTerm.name} due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }
}

module.exports = BillingTermAPI;
