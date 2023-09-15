const mongoose = require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { validObjectId } = require('../../../utils/schema');

const { RestError } = apiResponse;

class AssignmentStatusApi extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.configuration = _.get(options, 'configuration');
  }

  _getQueryFilters(filters) {
    let query = {};

    if (_.has(filters, '_id')) {
      query._id = filters._id;
    }

    query = Object.assign(query, {
      lspId: this.lspId,
    }, _.get(filters, 'paginationParams', {}));
    return query;
  }

  async assignmentStatusExport(filters) {
    let csvStream;
    const queryFilters = this._getQueryFilters(filters);

    try {
      csvStream = this.schema.AssignmentStatus.gridAggregation().csvStream({
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

  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the Assignment Status list`);
    let list = [];
    const query = this._getQueryFilters(filters);

    try {
      list = await this.schema.AssignmentStatus.gridAggregation().exec({
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

  async retrieveById(assignmentStatusId) {
    if (!validObjectId(assignmentStatusId)) {
      throw new RestError(400, { message: 'Invalid ObjectId' });
    }
    const assignmentStatus = await this.schema.AssignmentStatus.findOneWithDeleted({
      _id: assignmentStatusId,
      lspId: this.lspId,
    });

    if (_.isNil(assignmentStatus)) {
      throw new RestError(404, { message: `Assignment status with id ${assignmentStatusId} was not found` });
    }
    return assignmentStatus;
  }

  async create(assignmentStatus) {
    delete assignmentStatus._id;
    assignmentStatus.lspId = this.lspId;
    const newAssignmentStatus = new this.schema.AssignmentStatus(assignmentStatus);

    newAssignmentStatus.safeAssign(assignmentStatus);
    try {
      const assignmentStatusCreated = await newAssignmentStatus.save();
      return assignmentStatusCreated;
    } catch (err) {
      this.logger.debug(`Error ocurred upon saving new document type: ${err.message}`);
      if (err.message.match('duplicate')) {
        throw new RestError(500, { message: `${assignmentStatus.name} already exists` });
      }
      throw new RestError(500, { message: 'Error ocurred upon saving new document type' });
    }
  }

  async update(assignmentStatus) {
    if (!validObjectId(assignmentStatus._id)) {
      throw new RestError(400, { message: 'Invalid ObjectId' });
    }
    const _id = new mongoose.Types.ObjectId(assignmentStatus._id);
    const assignmentStatusInDb = await this.schema.AssignmentStatus.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });
    const hasNameChanged = assignmentStatusInDb.name !== assignmentStatus.name;

    if (_.isNil(assignmentStatusInDb)) {
      throw new RestError(404, { message: 'Assignment Status does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'assignmentStatus',
    });
    await concurrencyReadDateChecker.failIfOldEntity(assignmentStatusInDb);
    assignmentStatusInDb.safeAssign(assignmentStatus);
    const assignmentStatusUpdated = await assignmentStatusInDb.save(assignmentStatus);

    if (hasNameChanged) {
      assignmentStatusInDb.updateEmbeddedEntities();
    }
    return assignmentStatusUpdated;
  }
}

module.exports = AssignmentStatusApi;
