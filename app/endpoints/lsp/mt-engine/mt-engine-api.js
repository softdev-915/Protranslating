const mongoose = require('mongoose');
const _ = require('lodash');
const { RestError } = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { validObjectId } = require('../../../utils/schema');

class MtEngineAPI extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.configuration = _.get(options, 'configuration');
  }

  _getQueryFilters(filters) {
    return { lspId: this.lspId, ..._.get(filters, 'paginationParams', {}) };
  }

  async export(filters) {
    const query = this._getQueryFilters(filters);
    let csvStream;

    try {
      const properFilters = _.omit(query, '__tz');
      csvStream = this.schema.MtEngine.gridAggregation().csvStream({
        filters: properFilters,
        utcOffsetInMinutes: filters.__tz,
        shouldPaginate: false,
      });
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error transforming to csv. Error: ${message}`);
      throw new RestError(500, {
        message: err,
        stack: err.stack,
      });
    }
    return csvStream;
  }

  async list(filters) {
    this.logger.debug(`User ${_.get(this, 'user.email', '')} retrieved the mt engines list`);
    let list = [];
    const query = this._getQueryFilters(filters);

    try {
      list = await this.schema.MtEngine.gridAggregation().exec({
        filters: query,
        utcOffsetInMinutes: filters.__tz,
      });
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error performing mt engine aggregation. Error: ${message}`);
      throw new RestError(500, {
        message: err,
        stack: err.stack,
      });
    }
    return {
      list,
      total: list.length,
    };
  }

  async mtEngineDetail(_id) {
    if (!validObjectId(_id)) {
      throw new RestError(400, { message: 'Invalid ObjectId' });
    }
    try {
      const mtEngine = await this.schema.MtEngine.findOneWithDeleted({ _id, lspId: this.lspId });
      return mtEngine;
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error while retrieving mt engine record with _id ${_id} for user with email: ${_.get(this, 'user.email', '')}. Error: ${message}`);
      throw new RestError(404, {
        message,
        stack: err.stack,
      });
    }
  }

  async create(mtEngine) {
    this.logger.debug(`User ${_.get(this, 'user.email', '')} will create mt-engine with name ${mtEngine.name}`);
    delete mtEngine._id;
    const defMtEngine = {
      mtProvider: null,
      lspId: this.lspId,
      createdBy: _.get(this, 'user.email', ''),
    };
    const newMtEngine = new this.schema.MtEngine(defMtEngine);
    newMtEngine.safeAssign(mtEngine);
    const mtEngineCreated = await this._save(newMtEngine);
    return mtEngineCreated;
  }

  async update(mtEngine) {
    if (!validObjectId(mtEngine._id)) {
      throw new RestError(400, { message: 'Invalid ObjectId' });
    }
    const _id = new mongoose.Types.ObjectId(mtEngine._id);
    this.logger.debug(`User ${_.get(this, 'user.email', '')} will update mt-engine with _id ${_id.toString()}`);
    const mtEngineInDb = await this.schema.MtEngine
      .findOneWithDeleted({ _id, lspId: this.lspId });

    if (_.isNil(mtEngineInDb)) {
      throw new RestError(404, { message: 'Mt engine does not exist' });
    }
    if (!_.get(mtEngineInDb, 'isEditable', true)) {
      throw new RestError(403, { message: 'This Mt engine cannot be updated' });
    }
    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'mtEngine',
    });
    await concurrencyReadDateChecker.failIfOldEntity(mtEngineInDb);
    mtEngineInDb.safeAssign(mtEngine);
    mtEngineInDb.deleted = _.get(mtEngineInDb, 'deleted', false);
    const mtEngineUpdated = await this._save(mtEngineInDb);
    return mtEngineUpdated;
  }

  async _save(mtEngine) {
    try {
      await mtEngine.save();
      return mtEngine;
    } catch (err) {
      if (err.message.match(/.*duplicate key*./)) {
        this.logger.debug(`User ${_.get(this, 'user.email', '')} couldn't save the mt engine: ${mtEngine.name} due to err: duplicated key`);
        throw new RestError(409, { message: `MT engine with ${mtEngine.mtProvider} provider already exists` });
      }
      this.logger.debug(`User ${_.get(this, 'user.email', '')} couldn't save the mt engine: ${mtEngine.mtProvider} due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }
}

module.exports = MtEngineAPI;
