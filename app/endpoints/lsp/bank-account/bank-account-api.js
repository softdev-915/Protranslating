const _ = require('lodash');
const moongoose = require('mongoose');
const { RestError } = require('../../../components/api-response');
const SchemasAwareApi = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');

class BankAccountApi extends SchemasAwareApi {
  _getQueryFilters({ paginationParams = {} }) {
    return { query: { lspId: this.lspId, ...paginationParams } };
  }

  async list(filters) {
    let list = [];

    try {
      const { query } = this._getQueryFilters(filters);

      list = await this.schema.BankAccount.gridAggregation().exec({
        filters: query, utcOffsetInMinutes: filters.__tz,
      });
    } catch (error) {
      this.logger.error(`Error retrieving accounts list: ${error}`);
      throw new RestError(500, error);
    }
    return { list, total: list.length };
  }

  async export(filters) {
    let csvStream;

    try {
      const { query } = this._getQueryFilters(filters);

      csvStream = this.schema.BankAccount.gridAggregation().csvStream({
        filters: query,
        utcOffsetInMinutes: filters.__tz,
        shouldPaginate: false,
      });
    } catch (error) {
      this.logger.error(`Error generating csv: ${error}`);
      throw new RestError(500, error);
    }
    return csvStream;
  }

  async findById(id) {
    const account = await this.schema.BankAccount.findOneWithDeleted({
      _id: new moongoose.Types.ObjectId(id), lspId: this.lspId,
    });

    if (_.isEmpty(account)) {
      throw new RestError(404, { message: 'Bank account is not found' });
    }
    return account;
  }

  async create(accountRaw = {}) {
    delete accountRaw._id;
    const account = new this.schema.BankAccount(accountRaw);

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
      entityName: 'bankAccount',
    });
    await concurrencyReadDateChecker.failIfOldEntity(account);
    account.safeAssign(accountRaw);
    try {
      const updatedAccount = await account.save(accountRaw);
      return updatedAccount;
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

module.exports = BankAccountApi;
