const mongoose = require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');

const { RestError } = apiResponse;

class TaxFormAPI extends SchemaAwareAPI {
  _getQueryFilters(filters) {
    let query = { lspId: this.lspId };

    if (filters && filters._id) {
      query._id = filters._id;
    }

    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    return query;
  }

  /** Returns a csv file
   * @param {String} filters.id the tax forms id to filter.
   */
  async taxFormExport(filters) {
    const query = this._getQueryFilters(filters);
    let csvStream;

    try {
      csvStream = this.schema.TaxForm.gridAggregation().csvStream({
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
   * Returns the tax form list
   * @param {Object} user Current user making the query
   * @param {String} filters.id the tax forms id to filter.
   */
  async list(filters) {
    let list = [];
    const queryFilters = this._getQueryFilters(filters);

    try {
      list = await this.schema.TaxForm.gridAggregation().exec({
        filters: queryFilters,
        utcOffsetInMinutes: filters.__tz,
      });
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error performing tax form aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    this.logger.debug(`User ${this.user.email} retrieved the tax form list`);
    return {
      list,
      total: list.length,
    };
  }

  async findOne(taxFormId) {
    // Search specific tax form
    const taxForm = await this.schema.TaxForm.findOneWithDeleted({
      _id: taxFormId,
      lspId: this.lspId,
    });

    this.logger.debug(`User ${this.user.email} retrieved tax form ${taxFormId}`);
    return taxForm;
  }

  async create(taxForm) {
    delete taxForm._id;
    const taxFormInDb = await this.schema.TaxForm.findOneWithDeleted({
      name: taxForm.name,
      lspId: this.lspId,
    });

    if (taxFormInDb) {
      throw new RestError(409, { message: 'Tax Form alreay exists' });
    }

    const defTaxForm = {
      name: '',
      taxIdRequired: false,
      lspId: this.lspId,
    };
    const newTaxForm = new this.schema.TaxForm(defTaxForm);

    newTaxForm.safeAssign(taxForm);
    const taxFormCreated = await newTaxForm.save();
    return taxFormCreated;
  }

  async update(taxForm) {
    if (!mongoose.isValidObjectId(taxForm._id)) {
      throw new RestError(400, { message: 'Invalid tax ID' });
    }

    const taxFormInDb = await this.schema.TaxForm.findOneWithDeleted({
      _id: new mongoose.Types.ObjectId(taxForm._id),
      lspId: this.lspId,
    });

    if (!taxFormInDb) {
      throw new RestError(404, { message: 'Tax form does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'taxForm',
    });
    await concurrencyReadDateChecker.failIfOldEntity(taxFormInDb);

    taxFormInDb.safeAssign(taxForm);
    try {
      const updatedTaxForm = await taxFormInDb.save(taxForm);
      return updatedTaxForm;
    } catch (err) {
      if (err.message.match(/.*duplicate key*./)) {
        this.logger.debug(`User ${this.user.email} couldn't save the taxForm: ${taxForm.name} due to err: duplicated key`);
        throw new RestError(409, { message: `Tax form ${taxForm.name} already exists` });
      }
      this.logger.debug(`User ${this.user.email} couldn't save the taxForm: ${taxForm.name} due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }
}

module.exports = TaxFormAPI;
