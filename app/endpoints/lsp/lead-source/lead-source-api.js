const mongoose = require('mongoose');
const _ = require('lodash');
const { getRoles, hasRole } = require('../../../utils/roles');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');

const { RestError } = apiResponse;

class LeadSourceAPI extends SchemaAwareAPI {
  _getQueryFilters(filters) {
    let query = { lspId: this.lspId };

    if (filters && filters._id) {
      query._id = filters._id;
    }

    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    return query;
  }

  /** Returns csv stream
   * @param {String} filters.id the lead source id to filter.
   * @returns {Stream} the csv stream
   */
  async leadSourceExport(filters) {
    const query = this._getQueryFilters(filters);
    let csvStream;

    try {
      csvStream = this.schema.LeadSource.gridAggregation().csvStream({
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
   * Returns the lead source list
   * @param {Object} current user making the query
   * @param {String} filters.id the lead source id to filter.
   */
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the lead source list`);
    let list = [];
    const queryFilters = this._getQueryFilters(filters);

    // Search specific lead source
    if (queryFilters._id) {
      list = await this.schema.LeadSource.findWithDeleted({
        _id: filters._id,
        lspId: this.lspId,
      });
    } else {
      try {
        list = await this.schema.LeadSource.gridAggregation().exec({
          filters: queryFilters,
          utcOffsetInMinutes: filters.__tz,
        });
      } catch (err) {
        const message = err.message || err;

        this.logger.error(`Error performing lead source aggregation. Error: ${message}`);
        throw new RestError(500, { message: err, stack: err.stack });
      }
    }
    return {
      list,
      total: list.length,
    };
  }

  async create(leadSource) {
    delete leadSource._id;
    const defLeadSource = {
      name: leadSource.name,
      lspId: this.lspId,
    };
    const newLeadSource = new this.schema.LeadSource(defLeadSource);

    newLeadSource.safeAssign(leadSource);

    const leadSourceInDb = await this.schema.LeadSource.findOneWithDeleted({
      name: leadSource.name,
      lspId: this.lspId,
    });

    if (!_.isNil(leadSourceInDb)) {
      throw new RestError(409, { message: 'Lead source already exists' });
    }
    const leadSourceCreated = await newLeadSource.save();
    return leadSourceCreated;
  }

  async update(leadSource) {
    const roles = getRoles(this.user);
    const canDelete = hasRole('LEAD-SOURCE_DELETE_ALL', roles);
    const isValidId = mongoose.isValidObjectId(leadSource._id);

    if (!isValidId) {
      this.logger.debug(`Invalid ObjectId ${leadSource._id} of leadSource entity when trying to update`);
      throw new RestError(500, { message: `Error updating lead source. Invalid ObjectId ${leadSource._id} for lead Source entity` });
    }
    const leadSourceInDb = await this.schema.LeadSource.findOneWithDeleted({
      _id: leadSource._id,
      lspId: this.lspId,
    });

    if (!leadSourceInDb) {
      throw new RestError(404, { message: 'Lead source does not exist' });
    }
    if (leadSourceInDb.deleted !== leadSource.deleted) {
      if (!canDelete) {
        throw new RestError(500, { message: 'You are not allowed to update the entity' });
      }
    }
    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'leadSource',
    });
    await concurrencyReadDateChecker.failIfOldEntity(leadSourceInDb);

    leadSourceInDb.safeAssign(leadSource);

    leadSourceInDb.deleted = _.get(leadSourceInDb, 'deleted', false);
    try {
      const leadSourceUpdated = await leadSourceInDb.save(leadSource);
      return leadSourceUpdated;
    } catch (err) {
      if (err.message.match(/.*duplicate key*./)) {
        this.logger.debug(`User ${this.user.email} couldn't save the leadSource: ${leadSource.name} due to err: duplicated key`);
        throw new RestError(409, { message: `Lead source ${leadSource.name} already exists` });
      }
      this.logger.debug(`User ${this.user.email} couldn't save the leadSource: ${leadSource.name} due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }
}

module.exports = LeadSourceAPI;
