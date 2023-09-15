const mongoose = require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../../components/api-response');
const SchemaAwareAPI = require('../../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../../utils/concurrency');

const { RestError } = apiResponse;

class ActivityTagApi extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.configuration = _.get(options, 'configuration');
  }

  getQueryFilters(filters) {
    let query = {};

    if (filters && filters._id) {
      query._id = filters._id;
    }
    // Search all activity tags
    query = Object.assign(query, { lspId: this.lspId }, _.get(filters, 'paginationParams', {}));
    return {
      query,
    };
  }

  /**
   * Returns the activity tag list
   * @param {Object} activityTagFilters to filter the activity tag returned.
   * @param {String} activityTagFilters.id the activity tags's id to filter.
   */
  async activityTagList(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the activity tag list`);
    let list = [];
    const queryFilters = this.getQueryFilters(filters);

    // Search specific activityTag
    if (filters._id) {
      list = await this.schema.ActivityTag.findWithDeleted({
        _id: filters._id,
        lspId: this.lspId,
      });
    } else {
      try {
        list = await this.schema.ActivityTag.gridAggregation().exec({
          filters: queryFilters.query,
          utcOffsetInMinutes: filters.__tz,
        });
      } catch (err) {
        const message = err.message || err;

        this.logger.error(`Error performing ActivityTag aggregation. Error: ${message}`);
        throw new RestError(500, { message: err, stack: err.stack });
      }
    }
    return {
      list,
      total: list.length,
    };
  }

  /**
   * Returns the activity tag list as a csv file
   * @param {Object} activityFilters to filter the activities returned.
   */
  async activityTagExport(filters) {
    let csvStream;
    const queryFilters = this.getQueryFilters(filters);

    try {
      csvStream = this.schema.ActivityTag.gridAggregation().csvStream({
        filters: queryFilters.query,
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

  async create(activityTag) {
    const activityTagInDb = await this.schema.ActivityTag.findOne({
      lspId: this.lspId,
      name: activityTag.name,
    });

    if (activityTagInDb) {
      throw new RestError(409, { message: 'Activity Tag already exists' });
    }

    const defActivityTag = {
      name: '',
      lspId: this.lspId,
    };
    const newActivityTag = new this.schema.ActivityTag(defActivityTag);

    delete activityTag._id;
    newActivityTag.safeAssign(activityTag);
    await newActivityTag.save();
    return newActivityTag;
  }

  async update(activityTag) {
    const _id = new mongoose.Types.ObjectId(activityTag._id);
    const activityTagInDb = await this.schema.ActivityTag.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (!activityTagInDb) {
      throw new RestError(404, { message: 'Activity Tag does not exist' });
    }

    if (activityTag.name !== activityTagInDb.name) {
      const found = await this.schema.ActivityTag.findOneWithDeleted({
        lspId: this.lspId,
        name: activityTag.name,
      });

      if (found) {
        throw new RestError(409, { message: 'Activity Tag name already exists' });
      }
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'activityTag',
    });
    await concurrencyReadDateChecker.failIfOldEntity(activityTagInDb);

    activityTagInDb.safeAssign(activityTag);
    activityTagInDb.deleted = _.isBoolean(activityTag.deleted) ? activityTag.deleted : false;

    const updatedActivityTag = await activityTagInDb.save(activityTag);
    return updatedActivityTag;
  }
}

module.exports = ActivityTagApi;
