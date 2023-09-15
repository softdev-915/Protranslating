const mongoose = require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { validObjectId } = require('../../../utils/schema');
const { searchFactory } = require('../../../utils/pagination');

const { RestError } = apiResponse;
const BILL_EMBEDDED_FIELDS = ['number', 'costType'];

class ExpenseAccountAPI extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.logger = logger;
    this.configuration = _.get(options, 'configuration');
  }

  _getQueryFilters(filters) {
    const query = {
      lspId: this.lspId,
    };

    if (filters) {
      if (filters._id) {
        query._id = filters._id;
      }
    }
    return {
      query: Object.assign(query, _.get(filters, 'paginationParams', {})),
      pipeline: [],
    };
  }

  /**
   * Returns the expense account list as a csv file
   * @param {Object} ExpenseAccountsFilters to filter the groups returned.
   */
  async expenseAccountsExport(filters) {
    let csvStream;
    const { query, extraQueryParams, pipeline } = this._getQueryFilters(filters);

    try {
      csvStream = this.schema.ExpenseAccount.gridAggregation().csvStream({
        filters: query,
        utcOffsetInMinutes: filters.__tz,
        extraPipelines: pipeline,
        extraQueryParams,
        shouldPaginate: false,
      });
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error exporting expense account grid to csv. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    return csvStream;
  }

  /**
   * Returns the expense account list
   * @param {Object} ExpenseAccountFilters to filter the expense accounts returned.
   * @param {String} ExpenseAccountFilters.id the expense account id to filter.
   */
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the expense account list`);
    let list = [];
    const queryFilters = this._getQueryFilters(filters);

    try {
      list = await searchFactory({
        model: this.schema.ExpenseAccount,
        filters: queryFilters.query,
        extraPipelines: queryFilters.pipeline,
        extraQueryParams: queryFilters.extraQueryParams,
        utcOffsetInMinutes: filters.__tz,
      });
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error performing aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    return {
      list,
      total: list.length,
    };
  }

  async retrieveById(expenseAccountId) {
    if (!validObjectId(expenseAccountId)) {
      throw new RestError(400, { message: 'Invalid ObjectId' });
    }
    const expenseAccount = await this.schema.ExpenseAccount.findOneWithDeleted({
      _id: expenseAccountId,
      lspId: this.lspId,
    });

    if (_.isNil(expenseAccount)) {
      throw new RestError(404, { message: `Expense Account with _id ${expenseAccountId} was not found` });
    }
    return expenseAccount;
  }

  async create(expenseAccount) {
    delete expenseAccount._id;
    const defExpenseAccount = {
      name: '',
      lspId: this.lspId,
      createdBy: this.user.email,
    };
    let expenseAccountDb;

    try {
      expenseAccountDb = await this.schema.ExpenseAccount.findOne({
        lspId: this.lspId,
        number: expenseAccount.number,
      });
    } catch (e) {
      this.logger.error(`Error Creating Expense Account. Error: ${e.message}`);
    }
    if (!_.isNil(expenseAccountDb)) {
      throw new RestError(400, { message: 'Expense Account already exists. Please enter a unique number' });
    }
    const newExpenseAccount = new this.schema.ExpenseAccount(defExpenseAccount);

    newExpenseAccount.safeAssign(expenseAccount);
    const expenseAccountCreated = await newExpenseAccount.save();
    return expenseAccountCreated;
  }

  async update(expenseAccount) {
    const _id = new mongoose.Types.ObjectId(expenseAccount._id);
    const expenseAccountInDb = await this.schema.ExpenseAccount.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (!expenseAccountInDb) {
      throw new RestError(404, { message: 'Expense account does not exist' });
    }
    const oldExpenseAccount = {
      number: expenseAccountInDb.number,
      costType: expenseAccountInDb.costType,
    };
    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'expenseAccount',
    });
    await concurrencyReadDateChecker.failIfOldEntity(expenseAccountInDb);
    expenseAccountInDb.safeAssign(expenseAccount);
    expenseAccountInDb.deleted = _.get(expenseAccountInDb, 'deleted', false);
    const modifications = await expenseAccountInDb.getModifications();
    let billModifiedEmbeddedField;

    _.forEach(BILL_EMBEDDED_FIELDS, (billAssociatedField) => {
      if (modifications.includes(billAssociatedField)) {
        billModifiedEmbeddedField = billAssociatedField;
      }
    });
    if (!_.isNil(billModifiedEmbeddedField)) {
      const bill = await this.schema.Bill.findOne({ 'serviceDetails.expenseAccountNo': oldExpenseAccount.number });

      if (!_.isNil(bill)) {
        this.logger.error(`Error updating the expense account ${expenseAccountInDb._id.toString()}. Error: Cannot update the expense account associated with a bill`);
        throw new RestError(400, {
          message: 'GL Account has amounts allocated to it and cannot be updated',
        });
      }
    }
    try {
      const expenseAccountUpdated = await expenseAccountInDb.save(expenseAccount);
      return expenseAccountUpdated;
    } catch (err) {
      if (err.message.match(/.*duplicate key*./)) {
        this.logger.debug(`User ${this.user.email} couldn't save the expenseAccount: ${expenseAccount.number} due to err: duplicated key`);
        const message = `Expense Account Number ${expenseAccount.number} already exists. Please enter a unique value`;

        throw new RestError(409, { message });
      }
      this.logger.debug(`User ${this.user.email} couldn't save the expenseAccount: ${expenseAccount.number} due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }
}

module.exports = ExpenseAccountAPI;
