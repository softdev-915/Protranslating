// eslint-disable-next-line global-require
const mongoose = global.mongoose || require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');

const { RestError } = apiResponse;

class IpInstructionsDeadlineAPI extends SchemaAwareAPI {
  _getQueryFilters(filters) {
    let query = { lspId: this.lspId };

    if (filters && filters._id) {
      query._id = filters._id;
    }

    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    return query;
  }

  /**
   * Returns the ip instructions deadlines list
   * @param {Object} ipInstructionDeadlineFilters to filter the ip instructions deadlines returned.
   */
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the ip instructions deadlines list`);
    let list = [];
    const queryFilters = this._getQueryFilters(filters);

    try {
      list = await this.schema.IpInstructionsDeadline.gridAggregation().exec({
        filters: queryFilters,
        utcOffsetInMinutes: filters.__tz,
      });
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error performing translation unit aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    return {
      list,
      total: list.length,
    };
  }

  async getIpInstructionsDeadline(filters) {
    if (filters._id) {
      return await this.schema.IpInstructionsDeadline.findOneWithDeleted({
        _id: filters._id,
        lspId: this.lspId,
      });
    }
    throw new Error('Id was not provided for retrieving ipInstructionsDeadline');
  }

  async create(ipInstructionsDeadline) {
    delete ipInstructionsDeadline._id;
    const defIpInstructionsDeadline = {
      totalOrClaimsWordCount: '',
      noticePeriod: '',
      lspId: this.lspId,
      createdBy: this.user.email,
    };
    const newIpInstructionsDeadline = new this.schema
      .IpInstructionsDeadline(defIpInstructionsDeadline);
    newIpInstructionsDeadline.safeAssign(ipInstructionsDeadline);
    const ipInstructionsDeadlineCreated = await this._save(newIpInstructionsDeadline);
    return ipInstructionsDeadlineCreated;
  }

  async update(ipInstructionsDeadline) {
    const _id = new mongoose.Types.ObjectId(ipInstructionsDeadline._id);
    const ipInstructionsDeadlineInDb = await this.schema.IpInstructionsDeadline.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (!ipInstructionsDeadlineInDb) {
      throw new RestError(404, { message: 'Ip Instructions Deadline does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'ipInstructionsDeadline',
    });
    await concurrencyReadDateChecker.failIfOldEntity(ipInstructionsDeadlineInDb);
    ipInstructionsDeadlineInDb.safeAssign(ipInstructionsDeadline);
    ipInstructionsDeadlineInDb.deleted = _.get(ipInstructionsDeadlineInDb, 'deleted', false);
    const ipInstructionsDeadlineUpdated = await this._save(ipInstructionsDeadlineInDb);
    return ipInstructionsDeadlineUpdated;
  }

  async _save(ipInstructionsDeadline) {
    try {
      await ipInstructionsDeadline.save();
      return ipInstructionsDeadline;
    } catch (err) {
      if (err.message.match(/.*duplicate key*./)) {
        this.logger
          .debug(`User ${this.user.email} couldn't create the ip instructions deadline for: ${ipInstructionsDeadline.totalOrClaimsWordCount} total or claims word count due to err: duplicated key`);
        throw new RestError(409, { message: `Ip Instructions Deadline for ${ipInstructionsDeadline.totalOrClaimsWordCount} total or claims word count already exists` });
      }
      this.logger.debug(`User ${this.user.email} couldn't create the ip instructions deadline for: ${ipInstructionsDeadline.totalOrClaimsWordCount} total or claims word due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }
}

module.exports = IpInstructionsDeadlineAPI;
