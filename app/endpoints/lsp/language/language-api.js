const mongoose = require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');

const { RestError } = apiResponse;

class LanguageApi extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.configuration = _.get(options, 'configuration');
  }

  /**
   * Returns the languages list as a csv file
   * @param {Object} groupFilters to filter the groups returned.
   */
  async languageExport(filters) {
    let query = {};
    let csvStream;

    this.logger.debug(`User ${this.user.email} retrieved the language list`);
    if (filters && filters._id) {
      query._id = filters._id;
    }
    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    try {
      csvStream = this.schema.Language.gridAggregation().csvStream({
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
   * Returns the language's list
   * @param {Object} languageFilters to filter the languages returned.
   * @param {String} languageFilters.id the language's id to filter.
   */
  async languageList(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the language list`);

    let list = [];
    let query = {};

    if (filters && filters._id) {
      query._id = filters._id;
    }
    // Search specific language
    if (query._id) {
      list = await this.schema.Language.findWithDeleted(query).sort({ name: 1 });
    } else {
      query = Object.assign(query, _.get(filters, 'paginationParams', {}));
      try {
        list = await this.schema.Language.gridAggregation().exec({
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

  async ensureUniqueLanguage(language) {
    const languageInDb = await this.schema.Language.findOne(
      { isoCode: language.isoCode },
    );

    if (!_.isNil(languageInDb) && language._id.toString() !== languageInDb._id.toString()) {
      throw new RestError(409, { message: `Language with ISO code ${language.isoCode} already exists` });
    }
  }

  async create(language) {
    const defLanguage = {
      name: '',
      isoCode: '',
      createdBy: this.user.email,
    };
    const newLanguage = new this.schema.Language(defLanguage);

    await this.ensureUniqueLanguage(language);
    // this line prevents the frontend override private things like createdBy or _id
    language = _.pick(language, ['name', 'isoCode', 'deleted']);
    newLanguage.safeAssign(language);
    await newLanguage.save();
    return newLanguage;
  }

  async update(language) {
    const _id = new mongoose.Types.ObjectId(language._id);
    const languageInDb = await this.schema.Language.findOneWithDeleted({
      _id,
    });

    if (!languageInDb) {
      throw new RestError(404, { message: 'Language doesn\'t exist' });
    }
    await this.ensureUniqueLanguage(language);
    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'language',
    });
    await concurrencyReadDateChecker.failIfOldEntity(languageInDb);
    languageInDb.safeAssign(language);
    languageInDb.deleted = _.isBoolean(language.deleted) ? language.deleted : false;
    const updatedLanguage = await languageInDb.save(language);
    return updatedLanguage;
  }
}

module.exports = LanguageApi;
