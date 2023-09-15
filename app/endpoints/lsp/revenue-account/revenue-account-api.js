const _ = require('lodash');
const { Types: { ObjectId } } = require('mongoose');
const { RestError } = require('../../../components/api-response');
const SchemasAwareApi = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');

class RevenueAccountApi extends SchemasAwareApi {
  _getQueryFilters(filters) {
    const { lspId } = this;
    const query = { lspId, ..._.get(filters, 'paginationParams', {}) };
    return { query };
  }

  async list(filters) {
    let list = [];
    const { query } = this._getQueryFilters(filters);

    try {
      list = await this.schema.Account.gridAggregation().exec({
        filters: query,
        utcOffsetInMinutes: filters.__tz,
      });
    } catch (err) {
      this.logger.error(`Error retrieving accounts list: ${err}`);
      throw new RestError(500, err);
    }
    return { list, total: list.length };
  }

  async export(filters) {
    let csvStream;
    const { query } = this._getQueryFilters(filters);

    try {
      csvStream = this.schema.Account.gridAggregation().csvStream({
        filters: query,
        utcOffsetInMinutes: filters.__tz,
        shouldPaginate: false,
      });
    } catch (e) {
      this.logger.error(`Error generating csv: ${e}`);
      throw new RestError(500, e);
    }
    return csvStream;
  }

  async findById(id) {
    const account = await this.schema.Account.findOneWithDeleted({
      _id: new ObjectId(id),
      lspId: this.lspId,
    });

    if (_.isNil(account)) {
      throw new RestError(404, { message: 'Account is not found' });
    }
    return account;
  }

  async create(accountRaw = {}) {
    delete accountRaw._id;
    const account = new this.schema.Account(accountRaw);

    account.lspId = this.lspId;
    try {
      await account.save();
    } catch (err) {
      if (err.message.match(/.*duplicate key*./)) {
        let message = 'Number field input must be unique';

        if (err.message.match(/.*name_1.*/)) {
          message = 'Name field input must be unique';
        }
        throw new RestError(409, { message });
      }
      throw new RestError(400, err);
    }
    return account;
  }

  async update(id, accountRaw) {
    const account = await this.findById(id);
    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'account',
    });
    await concurrencyReadDateChecker.failIfOldEntity(account);
    account.safeAssign(accountRaw);
    try {
      await account.save(accountRaw);
      return account;
    } catch (err) {
      if (err.message.match(/.*duplicate key*./)) {
        let message = 'Number field input must be unique';

        if (err.message.match(/.*name_1.*/)) {
          message = 'Name field input must be unique';
        }
        throw new RestError(409, { message });
      }
      throw new RestError(400, err);
    }
  }
}

module.exports = RevenueAccountApi;
