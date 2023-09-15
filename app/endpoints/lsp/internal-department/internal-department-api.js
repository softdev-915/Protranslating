const mongoose = require('mongoose');
const _ = require('lodash');
const SchemaAwareAPI = require('../../schema-aware-api');
const { getRoles, hasRole } = require('../../../utils/roles');
const apiResponse = require('../../../components/api-response');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');

const { RestError } = apiResponse;

class InternalDepartmentAPI extends SchemaAwareAPI {
  _getQueryFilters(filters) {
    let query = { lspId: this.lspId };

    if (filters && filters._id) {
      query._id = filters._id;
    }

    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    return query;
  }

  /**
   * Returns the internal Departments list as a csv file
   * @param {Object} internalDepartmenFilters to filter the internal departments returned.
   */
  async internalDepartmentExport(filters) {
    let csvStream;
    const query = this._getQueryFilters(filters);

    try {
      csvStream = this.schema.InternalDepartment.gridAggregation().csvStream({
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
   * Returns the internal departments list
   * @param {Object} filterObj filters to filter the internal departments returned.
   * @param {String} filterObj._id the internalDepartment id to filter.
   */
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the breakdown list`);
    let list = [];
    const query = this._getQueryFilters(filters);
    const roles = getRoles(this.user);
    const canReadAll = hasRole('INTERNAL-DEPARTMENT_READ_ALL', roles);

    // Search specific internal department
    if (filters._id) {
      list = await this.schema.InternalDepartment.findWithDeleted({
        _id: filters._id,
        lspId: this.lspId,
      });
    } else {
      try {
        if (!canReadAll) {
          const userInternalDepartments = _.get(this.user, 'internalDepartments', []);

          query._id = {
            $in: userInternalDepartments.map(mongoose.Types.ObjectId),
          };
        }
        list = await this.schema.InternalDepartment.gridAggregation().exec({
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

  async create(internalDepartment) {
    delete internalDepartment._id;
    const defInternalDepartment = {
      name: '',
      lspId: this.lspId,
      createdBy: this.user.email,
    };
    const newInternalDepartment = new this.schema.InternalDepartment(defInternalDepartment);

    newInternalDepartment.safeAssign(internalDepartment);
    const internalDepartmentInDb = await this.schema.InternalDepartment.findOneWithDeleted({
      name: internalDepartment.name,
      lspId: this.lspId,
    });

    if (!_.isNil(internalDepartmentInDb)) {
      throw new RestError(409, { message: 'Internal department already exists' });
    }
    const internalDepartmentCreated = await newInternalDepartment.save();
    return internalDepartmentCreated;
  }

  async update(internalDepartment) {
    const _id = new mongoose.Types.ObjectId(internalDepartment._id);
    const internalDepartmentInDb = await this.schema.InternalDepartment.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (!internalDepartmentInDb) {
      throw new RestError(404, { message: `Internal department ${_id} does not exist` });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'internalDepartment',
    });
    await concurrencyReadDateChecker.failIfOldEntity(internalDepartmentInDb);
    internalDepartmentInDb.safeAssign(internalDepartment);
    internalDepartmentInDb.deleted = _.get(internalDepartmentInDb, 'deleted', false);
    try {
      const modifications = internalDepartmentInDb.getModifications();
      const internalDepartmentUpdated = await internalDepartmentInDb.save(internalDepartment);
      await this.schema.InternalDepartment.postSave(internalDepartment, modifications);
      return internalDepartmentUpdated;
    } catch (err) {
      if (err.message.match(/.*duplicate key*./)) {
        this.logger.debug(`User ${this.user.email} couldn't save the internalDepartment: ${internalDepartment.name} due to err: duplicated key`);
        throw new RestError(409, { message: `Internal department ${internalDepartment.name} already exists` });
      }
      this.logger.debug(`User ${this.user.email} couldn't save the internalDepartment: ${internalDepartment.name} due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }
}

module.exports = InternalDepartmentAPI;
