const mongoose = require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');

const { RestError } = apiResponse;

class CatToolApi extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.configuration = _.get(options, 'configuration');
  }

  _getQueryFilters(filters) {
    let query = {};

    if (filters && filters._id) {
      query._id = filters._id;
    }
    query = Object.assign(query, { lspId: this.lspId }, _.get(filters, 'paginationParams', {}));
    return {
      query,
    };
  }

  /**
   * Returns the cat tool list
   * @param {Object} catToolFilters to filter the cat tool returned.
   * @param {String} catToolFilters.id the cat tool's id to filter.
   */
  async catToolList(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the cat Tool list`);

    let list = [];
    const queryFilters = this._getQueryFilters(filters);

    // Search specific catTool
    if (queryFilters.query._id) {
      list = await this.schema.CatTool.findWithDeleted({
        _id: queryFilters.query._id,
        lspId: this.lspId,
      });
    } else {
      try {
        list = await this.schema.CatTool.gridAggregation().exec({
          filters: queryFilters.query,
          utcOffsetInMinutes: filters.__tz,
        });
      } catch (err) {
        const message = err.message || err;

        this.logger.error(`Error performing CAT Tool aggregation. Error: ${message}`);
        throw new RestError(500, { message: err, stack: err.stack });
      }
    }
    return {
      list,
      total: list.length,
    };
  }

  /**
   * Returns the cat tool list as a csv file
   * @param {Object} catToolFilters to filter the cat tools returned.
   */
  async catToolExport(filters) {
    let csvStream;
    const queryFilters = this._getQueryFilters(filters);

    try {
      csvStream = this.schema.CatTool.gridAggregation().csvStream({
        filters: queryFilters.query,
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

  async create(user, catTool) {
    const defCatTool = {
      lspId: this.lspId,
      name: _.get(catTool, 'name', ''),
      createdBy: user.email,
    };

    delete catTool._id;
    const newCatTool = new this.schema.CatTool(defCatTool);

    newCatTool.safeAssign(catTool);
    try {
      await newCatTool.save();
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error upon creating cat tool with name ${defCatTool.name}: ${message}`);
      if (message.match('duplicate key')) {
        throw new RestError(409, { message: 'CAT Tool already exists' });
      }
      throw new RestError(500, { message: `Error upon creating cat tool: ${message}` });
    }
    return newCatTool;
  }

  async update(user, catTool) {
    const _id = new mongoose.Types.ObjectId(catTool._id);
    const catToolInDb = await this.schema.CatTool.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (!catToolInDb) {
      throw new RestError(404, { message: 'CAT Tool does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(user, this.logger, {
      entityName: 'catTool',
    });
    await concurrencyReadDateChecker.failIfOldEntity(catToolInDb);

    catToolInDb.safeAssign(catTool);
    try {
      const updatedCatToolInDb = await catToolInDb.save(catTool);
      return updatedCatToolInDb;
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error upon creating cat tool with name ${catToolInDb.name}: ${message}`);
      if (message.match('duplicate key')) {
        throw new RestError(409, { message: 'CAT Tool already exists' });
      }
      throw new RestError(500, { message: `Error upon creating cat tool: ${message}` });
    }
  }
}

module.exports = CatToolApi;
