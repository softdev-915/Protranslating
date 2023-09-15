const mongoose = require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { validObjectId } = require('../../../utils/schema');

const { RestError } = apiResponse;

class SoftwareRequirementApi extends SchemaAwareAPI {
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
   * Returns the software requirement list
   * @param {Object} softwareRequirementFilters to filter the software requirement returned.
   * @param {String} softwareRequirementFilters.id the software requirement's id to filter.
   */
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the Software Requirement list`);
    let list = [];
    const query = this._getQueryFilters(filters);

    try {
      list = await this.schema.SoftwareRequirement.gridAggregation().exec({
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

  async retrieveById(softwareRequirementId) {
    if (!validObjectId(softwareRequirementId)) {
      throw new RestError(400, { message: 'Invalid ObjectId' });
    }
    const softwareRequirement = await this.schema.SoftwareRequirement.findOneWithDeleted({
      _id: softwareRequirementId,
      lspId: this.lspId,
    });
    if (!softwareRequirement) {
      throw new RestError(404, { message: `Software Requirement with _id ${softwareRequirementId} was not found` });
    }
    return softwareRequirement;
  }

  /**
   * Returns the software requirement list as a csv file
   * @param {Object} softwareRequirementFilters to filter the groups returned.
   */
  async softwareRequirementExport(filters) {
    let csvStream;
    const queryFilters = this._getQueryFilters(filters);
    try {
      csvStream = this.schema.SoftwareRequirement.gridAggregation().csvStream({
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

  async _save(softwareRequirement) {
    try {
      const modifications = softwareRequirement.getModifications();
      await softwareRequirement.save();
      if (!softwareRequirement.isNew) {
        await this.schema.SoftwareRequirement.postSave(softwareRequirement, modifications);
      }
      return softwareRequirement;
    } catch (err) {
      this.logger.debug(`Error ocurred upon saving new software requirement: ${err.message}`);
      if (err.message.match('duplicate')) {
        throw new RestError(500, { message: `${softwareRequirement.name} already exists` });
      }
      throw new RestError(500, { message: 'Error ocurred upon saving new software requirement' });
    }
  }

  async create(softwareRequirement) {
    softwareRequirement.lspId = this.lspId;
    delete softwareRequirement._id;
    const newSoftwareRequirement = new this.schema.SoftwareRequirement(softwareRequirement);
    newSoftwareRequirement.safeAssign(softwareRequirement);
    const softwareRequirementCreated = await this._save(newSoftwareRequirement);
    return softwareRequirementCreated;
  }

  async update(softwareRequirement) {
    if (!validObjectId(softwareRequirement._id)) {
      throw new RestError(400, { message: 'Invalid ObjectId' });
    }
    const _id = new mongoose.Types.ObjectId(softwareRequirement._id);
    const softwareRequirementInDb = await this.schema.SoftwareRequirement.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (!softwareRequirementInDb) {
      throw new RestError(404, { message: 'Software Requirement does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'softwareRequirement',
    });
    await concurrencyReadDateChecker.failIfOldEntity(softwareRequirementInDb);
    softwareRequirementInDb.safeAssign(softwareRequirement);
    const softwareRequirementUpdated = await this._save(softwareRequirementInDb);
    return softwareRequirementUpdated;
  }
}

module.exports = SoftwareRequirementApi;
