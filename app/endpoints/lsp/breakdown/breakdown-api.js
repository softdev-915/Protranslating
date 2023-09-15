const mongoose = require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');

const { RestError } = apiResponse;

class BreakdownAPI extends SchemaAwareAPI {
  _getQueryFilters(filters) {
    let query = { lspId: this.lspId };

    if (filters && filters._id) {
      query._id = filters._id;
    }

    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    return query;
  }

  /**
   * Returns the breakdown list as a csv file
   * @param {Object} BreakdownsFilters to filter the groups returned.
   */
  async breakdownExport(filters) {
    let csvStream;
    const query = this._getQueryFilters(filters);

    try {
      csvStream = this.schema.Breakdown.gridAggregation().csvStream({
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
   * Returns the breakdown list
   * @param {Object} BreakdownFilters to filter the breakdowns returned.
   * @param {String} BreakdownFilters.id the breakdown id to filter.
   */
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the breakdown list`);
    let list = [];
    const query = this._getQueryFilters(filters);

    // Search specific breakdown
    if (filters._id) {
      list = await this.schema.Breakdown.findWithDeleted({
        _id: filters._id,
        lspId: this.lspId,
      });
    } else {
      try {
        list = await this.schema.Breakdown.gridAggregation().exec({
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

  async create(breakdown) {
    delete breakdown._id;
    const defBreakdown = {
      name: '',
      lspId: this.lspId,
      createdBy: this.user.email,
    };
    const newBreakdown = new this.schema.Breakdown(defBreakdown);

    newBreakdown.safeAssign(breakdown);
    const breakdownInDb = await this.schema.Breakdown.findOneWithDeleted({
      _id: new mongoose.Types.ObjectId(breakdown._id),
      lspId: this.lspId,
    });

    if (!_.isNil(breakdownInDb)) {
      throw new RestError(409, { message: 'Breakdown already exists' });
    }

    const breakdownCreated = await newBreakdown.save();
    return breakdownCreated;
  }

  async update(breakdown) {
    const breakdownInDb = await this.schema.Breakdown.findOneWithDeleted({
      _id: new mongoose.Types.ObjectId(breakdown._id),
      lspId: this.lspId,
    });

    if (!breakdownInDb) {
      throw new RestError(404, { message: 'Breakdown does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'breakdown',
    });
    await concurrencyReadDateChecker.failIfOldEntity(breakdownInDb);
    delete breakdown._id;
    breakdownInDb.safeAssign(breakdown);
    breakdownInDb.deleted = _.get(breakdownInDb, 'deleted', false);
    try {
      const breakdownUpdated = await breakdownInDb.save(breakdown);
      return breakdownUpdated;
    } catch (err) {
      if (err.message.match(/.*duplicate key*./)) {
        this.logger.debug(`User ${this.user.email} couldn't save the breakdown: ${breakdown.name} due to err: duplicated key`);
        throw new RestError(409, { message: `Breakdown ${breakdown.name} already exists` });
      }
      this.logger.debug(`User ${this.user.email} couldn't save the breakdown: ${breakdown.name} due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }
}

module.exports = BreakdownAPI;
