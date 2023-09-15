const mongoose = require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { validObjectId } = require('../../../utils/schema');
const { searchFactory, exportFactory } = require('../../../utils/pagination');
const { CsvExport } = require('../../../utils/csvExporter');

const { RestError } = apiResponse;

class AbilityExpenseAccountAPI extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.logger = logger;
    this.configuration = _.get(options, 'configuration');
  }

  _getQueryFilters(filters) {
    let query = { lspId: this.lspId };

    if (filters && filters._id) {
      query._id = filters._id;
    }

    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    return {
      query,
      pipeline: [{
        $lookup: {
          from: 'abilities',
          localField: 'ability',
          foreignField: '_id',
          as: 'ability',
        },
      }, {
        $lookup: {
          from: 'expenseAccounts',
          localField: 'expenseAccount',
          foreignField: '_id',
          as: 'expenseAccount',
        },
      }, {
        $addFields: {
          abilityObj: { $arrayElemAt: ['$ability', 0] },
          'expenseAccount.name': {
            $let: {
              vars: {
                expenseAccountItem: { $arrayElemAt: ['$expenseAccount', 0] },
              },
              in: { $concat: ['$$expenseAccountItem.number', ' - ', '$$expenseAccountItem.costType'] },
            },
          },
        },
      },
      {
        $addFields: {
          expenseAccount: '$expenseAccount.name',
          ability: '$abilityObj.name',
        },
      },
      {
        $project: {
          abilityObj: 0,
        },
      }],
    };
  }

  /**
   * Returns the ability ability expense account list as a csv file
   * @param {Object} AbilityExpenseAccountsFilters to filter the groups returned.
   */
  async abilityExpenseAccountExport(filters) {
    const { query, pipeline } = this._getQueryFilters(filters);

    try {
      const cursor = await exportFactory(
        this.schema.AbilityExpenseAccount,
        query,
        pipeline,
        filters.__tz,
      );
      const csvExporter = new CsvExport(cursor, {
        schema: this.schema.AbilityExpenseAccount,
        lspId: this.lspId,
        configuration: this.configuration,
        logger: this.logger,
        filters: query,
      });
      return csvExporter.export();
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error exporting data. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
  }

  /**
   * Returns the ability expense account list
   * @param {Object} AbilityExpenseAccountFilters to filter the ability expense accounts returned.
   * @param {String} AbilityExpenseAccountFilters.id the ability expense account id to filter.
   */
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the ability expense account list`);
    let list = [];
    const queryFilters = this._getQueryFilters(filters);

    try {
      list = await searchFactory({
        model: this.schema.AbilityExpenseAccount,
        filters: queryFilters.query,
        extraPipelines: queryFilters.pipeline,
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

  async retrieveById(abilityExpenseAccountId) {
    if (!validObjectId(abilityExpenseAccountId)) {
      throw new RestError(400, { message: 'Invalid ObjectId' });
    }
    const abilityExpenseAccount = await this.schema.AbilityExpenseAccount.findOneWithDeleted({
      _id: abilityExpenseAccountId,
      lspId: this.lspId,
    }).populate([{ path: 'ability' }, { path: 'expenseAccount' }]).lean();

    if (_.isNil(abilityExpenseAccount)) {
      throw new RestError(404, { message: `Ability Expense Account with _id ${abilityExpenseAccountId} was not found` });
    }
    const expenseAccountName = _.join([
      _.get(abilityExpenseAccount, 'expenseAccount.number', ''),
      _.get(abilityExpenseAccount, 'expenseAccount.costType', ''),
    ], ' - ');

    _.set(abilityExpenseAccount, 'expenseAccount.name', expenseAccountName);
    return abilityExpenseAccount;
  }

  async create(abilityExpenseAccount) {
    delete abilityExpenseAccount._id;
    const defAbilityExpenseAccount = {
      name: '',
      lspId: this.lspId,
      createdBy: this.user.email,
    };
    const newAbilityExpenseAccount = new this.schema.AbilityExpenseAccount(defAbilityExpenseAccount);

    newAbilityExpenseAccount.safeAssign(abilityExpenseAccount);
    try {
      const abilityExpenseAccountCreated = await newAbilityExpenseAccount.save();
      return abilityExpenseAccountCreated;
    } catch (err) {
      if (err.message.match(/.*duplicate key*./)) {
        this.logger.debug(`User ${this.user.email} couldn't save the abilityExpenseAccount: ${abilityExpenseAccount._id} due to err: duplicated key`);
        throw new RestError(409, { message: `Duplicated Ability Expense account combination. Please enter a unique combination. Ability Expense account ID ${abilityExpenseAccount._id} already exists` });
      }
      this.logger.debug(`User ${this.user.email} couldn't save the abilityExpenseAccount: ${abilityExpenseAccount._id} due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }

  async update(abilityExpenseAccount) {
    const _id = new mongoose.Types.ObjectId(abilityExpenseAccount._id);
    const abilityExpenseAccountInDb = await this.schema.AbilityExpenseAccount.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (!abilityExpenseAccountInDb) {
      throw new RestError(404, { message: 'Ability Expense account does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'abilityExpenseAccount',
    });
    await concurrencyReadDateChecker.failIfOldEntity(abilityExpenseAccountInDb);
    abilityExpenseAccountInDb.safeAssign(abilityExpenseAccount);

    try {
      const expenseAccountUpdated = await this.schema.AbilityExpenseAccount
        .findOneAndUpdateWithDeleted(
          { _id: abilityExpenseAccountInDb._id },
          { $set: abilityExpenseAccountInDb },
          { new: true },
        );
      return expenseAccountUpdated;
    } catch (err) {
      if (err.message.match(/.*duplicate key*./)) {
        this.logger.debug(`User ${this.user.email} couldn't save the abilityExpenseAccount: ${abilityExpenseAccount._id} due to err: duplicated key`);
        throw new RestError(409, { message: `Duplicated Ability Expense account combination. Please enter a unique combination. Ability Expense account ID ${abilityExpenseAccount._id} already exists` });
      }
      this.logger.debug(`User ${this.user.email} couldn't save the abilityExpenseAccount: ${abilityExpenseAccount._id} due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }
}

module.exports = AbilityExpenseAccountAPI;
