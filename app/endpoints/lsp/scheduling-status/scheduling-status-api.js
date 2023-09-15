const mongoose = require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');

const { RestError } = apiResponse;

class SchedulingStatusApi extends SchemaAwareAPI {
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

  _getSchedulingStatusQuery(filters) {
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

  async detail(schedulingStatusId) {
    const schedulingStatus = await this.schema.SchedulingStatus.findOneWithDeleted({
      _id: schedulingStatusId,
      lspId: this.lspId,
    });

    if (!schedulingStatus) {
      throw new RestError(404, { message: `Scheduling Status ${schedulingStatusId} does not exist` });
    }
    return schedulingStatus;
  }

  /**
   * Returns the schedulingStatus list
   * @param {Object} schedulingStatusFilters to filter the abilities returned.
   * @param {String} schedulingStatusFilters.id the schedulingStatus id to filter.
   */
  async schedulingStatusList(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the schedulingStatus list`);
    let list = [];
    const query = this._getSchedulingStatusQuery(filters);

    // Search specific schedulingStatus
    try {
      list = await this.schema.SchedulingStatus.gridAggregation().exec({
        filters: query,
        utcOffsetInMinutes: filters.__tz,
      });
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error performing schedulingStatus aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    return {
      list,
      total: list.length,
    };
  }

  /**
   * Returns the schedulingStatus list as a csv file
   * @param {Object} schedulingStatusFilters to filter the abilities returned.
   */
  async schedulingStatusExport(filters) {
    let csvStream;
    const query = this._getSchedulingStatusQuery(filters);

    try {
      csvStream = this.schema.SchedulingStatus.gridAggregation().csvStream({
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

  async create(schedulingStatus) {
    delete schedulingStatus._id;
    const defSchedulingStatus = {
      name: '',
      lspId: this.lspId,
    };
    const newSchedulingStatus = new this.schema.SchedulingStatus(defSchedulingStatus);

    newSchedulingStatus.safeAssign(schedulingStatus);
    const schedulingStatusInDb = await this.schema.SchedulingStatus.findOneWithDeleted({
      name: schedulingStatus.name,
      lspId: this.lspId,
    });

    if (!_.isNil(schedulingStatusInDb)) {
      throw new RestError(409, { message: 'Scheduling Status already exists' });
    }
    await newSchedulingStatus.save();
    return newSchedulingStatus;
  }

  async update(schedulingStatus) {
    const _id = new mongoose.Types.ObjectId(schedulingStatus._id);
    const schedulingStatusInDb = await this.schema.SchedulingStatus.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (!schedulingStatusInDb) {
      throw new RestError(404, { message: 'SchedulingStatus does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'schedulingStatus',
    });
    await concurrencyReadDateChecker.failIfOldEntity(schedulingStatusInDb);
    schedulingStatusInDb.safeAssign(schedulingStatus);
    const deleted = _.isBoolean(schedulingStatus.deleted) ? schedulingStatus.deleted : false;

    schedulingStatusInDb.deleted = deleted;
    const modifications = schedulingStatusInDb.getModifications();

    try {
      const updatedSchedulingStatus = await schedulingStatusInDb.save(schedulingStatus);

      await this.schema.SchedulingStatus.postSave(schedulingStatus, modifications);
      return updatedSchedulingStatus;
    } catch (e) {
      const message = e.message || e;

      if (/^Duplicated scheduling status.*/.test(e.message)) {
        throw new RestError(409, { message });
      }
      throw e;
    }
  }
}

module.exports = SchedulingStatusApi;
