const mongoose = require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');

const { RestError } = apiResponse;

class AbilityApi extends SchemaAwareAPI {
  /**
   * @param {Object} logger
   * @param {Object} options optional object.
   * @param {Object} options.configuration configuration.
   * @param {Object} options.user user that is user api.
   */
  constructor(logger, options) {
    super(logger, options);
    this.configuration = _.get(options, 'configuration');
  }

  _getAbilityQuery(filters) {
    const query = {
      lspId: this.lspId,
    };

    if (filters) {
      if (filters._id) {
        query._id = filters._id;
      }
    }
    return Object.assign(query, _.get(filters, 'paginationParams', {}));
  }

  /**
   * Returns the ability list
   * @param {Object} abilityFilters to filter the abilities returned.
   * @param {String} abilityFilters.id the ability id to filter.
   */
  async abilityList(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the ability list`);
    let list = [];
    const query = this._getAbilityQuery(filters);

    // Search specific ability
    if (filters._id) {
      list = await this.schema.Ability.findWithDeleted({
        _id: filters._id,
        lspId: this.lspId,
      });
    } else {
      const abilityNames = _.get(filters, 'paginationParams.filter.abilityNames', []);

      if (!_.isEmpty(abilityNames)) {
        query.name = {
          $in: abilityNames,
        };
        filters.paginationParams.filter = _.omit(filters.paginationParams.filter, ['abilityNames']);
      }
      list = await this.schema.Ability.gridAggregation().exec({
        filters: query,
        utcOffsetInMinutes: filters.__tz,
      });
    }
    return {
      list,
      total: list.length,
    };
  }

  /**
   * Returns the ability list as a csv file
   * @param {Object} abilityFilters to filter the abilities returned.
   */
  async abilityExport(filters) {
    let csvStream;
    const query = this._getAbilityQuery(filters);

    try {
      csvStream = this.schema.Ability.gridAggregation().csvStream({
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

  async create(user, ability) {
    const abilityInDb = await this.schema.Ability.findOne({
      name: ability.name,
      lspId: this.lspId,
    });

    if (abilityInDb) {
      throw new RestError(409, { message: 'Ability already exists' });
    }
    delete ability._id;
    const defAbility = {
      name: '',
      language: 0,
      catTool: 0,
      createdBy: user.email,
      lspId: this.lspId,
    };
    const newAbility = new this.schema.Ability(defAbility);

    newAbility.safeAssign(ability);
    const createdAbility = await newAbility.save();
    return createdAbility;
  }

  async update(user, ability) {
    const _id = new mongoose.Types.ObjectId(ability._id);
    const abilityInDb = await this.schema.Ability.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (!abilityInDb) {
      throw new RestError(404, { message: 'Ability does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(user, this.logger, {
      entityName: 'ability',
    });
    await concurrencyReadDateChecker.failIfOldEntity(abilityInDb);
    abilityInDb.safeAssign(ability);
    abilityInDb.deleted = _.isBoolean(ability.deleted) ? ability.deleted : false;
    try {
      const abilityUpdated = await abilityInDb.save(ability);
      return abilityUpdated;
    } catch (err) {
      if (err.message.match(/.*duplicate key*./)) {
        this.logger.debug(`User ${this.user.email} couldn't save the ability: ${ability._id} due to err: duplicated key`);
        throw new RestError(409, { message: `Ability with name ${ability.name} already exists` });
      }
      this.logger.debug(`User ${this.user.email} couldn't save the ability: ${ability._id} due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }
}

module.exports = AbilityApi;
