// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');

const { RestError } = apiResponse;

class ProviderInstructionAPI extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.configuration = _.get(options, 'configuration');
  }

  _getQueryFilters(filters) {
    let query = { lspId: this.lspId };
    if (!_.isNil(_.get(filters, '_id'))) {
      query._id = filters._id;
    }
    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    return query;
  }

  /**
   * Returns the provider instructions list as a csv file
   * @param {Object} providerInstructionsFilters to filter the groups returned.
   */
  async providerInstructionsExport(filters) {
    let csvStream;
    const query = this._getQueryFilters(filters);
    try {
      csvStream = this.schema.ProviderInstructions.gridAggregation().csvStream({
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
   * Returns the provider instruction list
   * @param {Object} user current user making the query
   * @param {String} providerInstructionsFilters.id the provider instruction's id to filter.
  */
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the provider instruction list`);
    let list = [];
    const query = this._getQueryFilters(filters);
    try {
      list = await this.schema.ProviderInstructions.gridAggregation().exec({
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

  async findOne(providerInstructionsId) {
    const providerInstructionsInDb = await this.schema.ProviderInstructions.findOneWithDeleted({
      _id: new mongoose.Types.ObjectId(providerInstructionsId),
      lspId: this.lspId,
    });
    return providerInstructionsInDb;
  }

  async create(providerInstructions) {
    delete providerInstructions._id;
    const defProviderInstruction = {
      name: '',
      body: '',
      lspId: this.lspId,
      createdBy: this.user.email,
    };
    const newProviderInstruction = new this.schema.ProviderInstructions(defProviderInstruction);
    newProviderInstruction.safeAssign(providerInstructions);
    const providerInstructionsCreated = await this._save(newProviderInstruction);
    return providerInstructionsCreated;
  }

  async update(providerInstructions) {
    const _id = new mongoose.Types.ObjectId(providerInstructions._id);
    const providerInstructionsInDb = await this.schema.ProviderInstructions.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (!providerInstructionsInDb) {
      throw new RestError(404, { message: 'provider instruction does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'providerInstruction',
    });
    await concurrencyReadDateChecker.failIfOldEntity(providerInstructionsInDb);

    providerInstructionsInDb.safeAssign(providerInstructions);

    providerInstructionsInDb.deleted = _.get(providerInstructionsInDb, 'deleted', false);
    const providerInstructionsUpdated = await this._save(providerInstructionsInDb);
    return providerInstructionsUpdated;
  }

  async _save(providerInstructions) {
    try {
      await providerInstructions.save();
      return providerInstructions;
    } catch (err) {
      if (err.message.include('duplicate key')) {
        this.logger.debug(`User ${this.user.email} couldn't save the providerInstructions: ${providerInstructions.name} due to err: duplicated key`);
        throw new RestError(409, { message: `provider instruction ${providerInstructions.name} already exists` });
      }
      this.logger.debug(`User ${this.user.email} couldn't save the providerInstructions: ${providerInstructions.name} due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }
}

module.exports = ProviderInstructionAPI;
