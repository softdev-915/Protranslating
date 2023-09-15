const mongoose = require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../../components/api-response');
const SchemaAwareAPI = require('../../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../../utils/concurrency');

const { RestError } = apiResponse;

class CompetenceLevelApi extends SchemaAwareAPI {
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
   * Returns the competence level list
   * @param {Object} competenceLevelFilters to filter the competence level returned.
   * @param {String} competenceLevelFilters.id the competence level's id to filter.
   */
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the Competence Level list`);
    let list = [];
    const query = this._getQueryFilters(filters);

    // Search specific competence level
    if (filters._id) {
      list = await this.schema.CompetenceLevel.findWithDeleted({
        _id: filters._id,
        lspId: this.lspId,
      });
    } else {
      try {
        list = await this.schema.CompetenceLevel.gridAggregation().exec({
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

  /**
   * Returns the competenece level list as a csv file
   * @param {Object} competenceLevelFilters to filter the groups returned.
   */
  async competenceLevelExport(filters) {
    let csvStream;
    const queryFilters = this._getQueryFilters(filters);

    try {
      csvStream = this.schema.CompetenceLevel.gridAggregation().csvStream({
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

  async create(competenceLevel) {
    delete competenceLevel._id;
    const defCompetenceLevel = {
      name: '',
      lspId: this.lspId,
      createdBy: this.user.email,
    };
    const newCompetenceLevel = new this.schema.CompetenceLevel(defCompetenceLevel);

    newCompetenceLevel.safeAssign(competenceLevel);
    const competenceLevelInDb = await this.schema.CompetenceLevel.findOneWithDeleted({
      name: competenceLevel.name,
      lspId: this.lspId,
    });

    if (!_.isNil(competenceLevelInDb)) {
      throw new RestError(409, { message: 'Competence level already exists' });
    }
    const competenceLevelCreated = await newCompetenceLevel.save();
    return competenceLevelCreated;
  }

  async update(competenceLevel) {
    const _id = new mongoose.Types.ObjectId(competenceLevel._id);
    const competenceLevelInDb = await this.schema.CompetenceLevel.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (_.isNil(competenceLevelInDb)) {
      throw new RestError(404, { message: 'Competence Level does not exist' });
    }
    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'competenceLevel',
    });
    await concurrencyReadDateChecker.failIfOldEntity(competenceLevelInDb);
    competenceLevelInDb.safeAssign(competenceLevel);
    competenceLevelInDb.deleted = _.isBoolean(competenceLevel.deleted) ? competenceLevel.deleted : false;
    const competenceLevelUpdated = await this._save(competenceLevelInDb);
    return competenceLevelUpdated;
  }

  async _save(competenceLevel) {
    try {
      const competenceLevelDB = await this.schema.CompetenceLevel.findOneWithDeleted({
        name: competenceLevel.name,
        lspId: this.lspId,
      });
      const { isNew } = competenceLevel;
      const competenceLevelDBId = _.get(competenceLevelDB, '_id', '');
      if (
        !_.isEmpty(competenceLevelDBId)
          && (!_.isEqual(competenceLevelDBId, competenceLevel._id))
      ) {
        this.logger.debug(`User ${this.user.email} couldn't ${isNew ? 'create' : 'update'} the unit: ${competenceLevel.name}`);
        throw new RestError(409, { message: `Competence level ${competenceLevel.name} already exists` });
      }
      const modifications = competenceLevel.getModifications();
      await this.provideTransaction(async (session) => {
        await competenceLevel.save({ session });
        if (!isNew) {
          await this.schema.CompetenceLevel.postSave(competenceLevel, modifications, session);
        }
      });
      return competenceLevel;
    } catch (err) {
      if (err.message.match(/.*duplicate key*./)) {
        this.logger.debug(`User ${this.user.email} couldn't create the unit: ${competenceLevel.name} due to err: duplicated key`);
        throw new RestError(409, { message: `Competence level ${competenceLevel.name} already exists` });
      }
      this.logger.debug(`User ${this.user.email} couldn't create the unit: ${competenceLevel.name} due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }
}

module.exports = CompetenceLevelApi;
