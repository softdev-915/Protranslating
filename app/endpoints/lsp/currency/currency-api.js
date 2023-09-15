const mongoose = require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { validObjectId } = require('../../../utils/schema');

const { RestError } = apiResponse;

class CurrencyAPI extends SchemaAwareAPI {
  _getQueryFilters(filters) {
    let query = {
      lspId: this.lspId,
    };

    if (filters && filters._id) {
      query._id = filters._id;
    }

    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    return query;
  }

  /**
   * Returns the currency list as a csv file
   * @param {Object} currencyFilters to filter the currencies returned.
   */
  async currencyExport(filters) {
    let csvStream;
    const query = this._getQueryFilters(filters);

    try {
      csvStream = this.schema.Currency.gridAggregation().csvStream({
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
   * Returns the currencies list
   * @param {Object} currencyFilters to filter the currencies returned.
   * @param {String} currencyFilters.id the currency's id to filter.
   */
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the currency list`);
    let list = [];
    const query = this._getQueryFilters(filters);

    // Search specific currency match
    if (filters._id) {
      list = await this.schema.Currency.findWithDeleted({
        _id: filters._id,
      });
    } else {
      try {
        list = await this.schema.Currency.gridAggregation().exec({
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

  async create(currency) {
    delete currency._id;
    const defCurrency = {
      name: '',
      createdBy: this.user.email,
      lspId: this.lspId,
    };
    const newCurrency = new this.schema.Currency(defCurrency);

    newCurrency.safeAssign(currency);
    const foundCurrency = await this.schema.Currency.findOne({
      isoCode: currency.isoCode,
      lspId: this.lspId,
    });

    if (!_.isNil(foundCurrency)) {
      throw new RestError(409, { message: `Currency with ISO Code ${currency.isoCode} already exists` });
    }
    const currencyCreated = await newCurrency.save();
    return currencyCreated;
  }

  async update(currency) {
    if (!validObjectId(currency._id)) {
      throw new Error('LSP id is not valid');
    }
    const _id = new mongoose.Types.ObjectId(currency._id);
    const currencyInDb = await this.schema.Currency.findOneWithDeleted({ _id, lspId: this.lspId });

    if (!currencyInDb) {
      throw new RestError(400, { message: 'Invalid ObjectId' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'currency',
    });
    await concurrencyReadDateChecker.failIfOldEntity(currencyInDb);
    currencyInDb.safeAssign(currency);
    currencyInDb.deleted = _.get(currencyInDb, 'deleted', false);
    try {
      const currencyUpdated = await currencyInDb.save(currency);
      return currencyUpdated;
    } catch (err) {
      const error = err.message || err;
      if (error.match(/.*duplicate key*./) || error.match(/.*Duplicated isoCode for currency*./)) {
        this.logger.debug(`User ${this.user.email} couldn't save the currency: ${currency.name} due to err: ${error}`);
        throw new RestError(409, { message: `Currency with ISO Code ${currency.isoCode} already exists` });
      }
      this.logger.debug(`User ${this.user.email} couldn't save the currency: ${currency.name} due to err: ${error}`);
      throw new RestError(500, { message: error });
    }
  }
}

module.exports = CurrencyAPI;
