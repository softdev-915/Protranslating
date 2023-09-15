const mongoose = require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');

const { RestError } = apiResponse;

class TranslationUnitAPI extends SchemaAwareAPI {
  _getQueryFilters(filters) {
    let query = { lspId: this.lspId };

    if (filters && filters._id) {
      query._id = filters._id;
    }

    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    return query;
  }

  /** Returns a csv file
   * @param {Object} unitFilters to filter the units returned.
   * @param {String} filters.id the billing unit's id to filter.
   */
  async translationUnitExport(filters) {
    const query = this._getQueryFilters(filters);
    let csvStream;

    try {
      csvStream = this.schema.TranslationUnit.gridAggregation().csvStream({
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
   * Returns the translation unit list
   * @param {Object} unitFilters to filter the units returned.
   * @param {String} unitFilters.id the unit id to filter.
   */
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the unitlist`);
    let list = [];
    const queryFilters = this._getQueryFilters(filters);

    // Search specific translation unit
    if (filters._id) {
      list = await this.schema.TranslationUnit.findWithDeleted({
        _id: filters._id,
        lspId: this.lspId,
      });
    } else {
      try {
        list = await this.schema.TranslationUnit.gridAggregation().exec({
          filters: queryFilters,
          utcOffsetInMinutes: filters.__tz,
        });
      } catch (err) {
        const message = err.message || err;

        this.logger.error(`Error performing translation unit aggregation. Error: ${message}`);
        throw new RestError(500, { message: err, stack: err.stack });
      }
    }
    return {
      list,
      total: list.length,
    };
  }

  async create(translationUnit) {
    delete translationUnit._id;
    const defTranslationUnit = {
      name: '',
      lspId: this.lspId,
      createdBy: this.user.email,
    };
    const newTranslationUnit = new this.schema.TranslationUnit(defTranslationUnit);

    newTranslationUnit.safeAssign(translationUnit);
    const translationUnitInDb = await this.schema.TranslationUnit.findOneWithDeleted({
      name: translationUnit.name,
      lspId: this.lspId,
    });

    if (!_.isNil(translationUnitInDb)) {
      throw new RestError(409, { message: 'Translation unit already exists' });
    }
    const translationUnitCreated = await newTranslationUnit.save();
    return translationUnitCreated;
  }

  async update(translationUnit) {
    const _id = new mongoose.Types.ObjectId(translationUnit._id);
    const translationUnitInDb = await this.schema.TranslationUnit.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (!translationUnitInDb) {
      throw new RestError(404, { message: 'Translation unit does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'translationUnit',
    });
    await concurrencyReadDateChecker.failIfOldEntity(translationUnitInDb);
    translationUnitInDb.safeAssign(translationUnit);
    translationUnitInDb.deleted = _.get(translationUnitInDb, 'deleted', false);
    try {
      const updatedTranslationUnit = await translationUnitInDb.save(translationUnit);
      return updatedTranslationUnit;
    } catch (err) {
      if (err.message.match(/.*duplicate key*./)) {
        this.logger.debug(`User ${this.user.email} couldn't create the unit: ${translationUnit.name} due to err: duplicated key`);
        throw new RestError(409, { message: `Translation Unit ${translationUnit.name} already exists` });
      }
      this.logger.debug(`User ${this.user.email} couldn't create the unit: ${translationUnit.name} due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }
}

module.exports = TranslationUnitAPI;
