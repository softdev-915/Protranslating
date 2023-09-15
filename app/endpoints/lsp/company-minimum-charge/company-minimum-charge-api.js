const mongoose = require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { areObjectIdsEqual } = require('../../../utils/schema');
const { searchFactory } = require('../../../utils/pagination');
const { CurrencyConverter } = require('../../currency-converter-api');

const { RestError } = apiResponse;

class CompanyMinimumChargeApi extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.configuration = _.get(options, 'configuration');
    this.currencyConverter = new CurrencyConverter(logger, options);
  }

  async detail(companyMinimumChargeId) {
    const companyMinimumCharge = await this.schema.CompanyMinimumCharge.findOneWithDeleted({
      _id: companyMinimumChargeId,
      lspId: this.lspId,
    });

    if (!companyMinimumCharge) {
      throw new RestError(404, { message: `Request Type ${companyMinimumChargeId} does not exist` });
    }
    return companyMinimumCharge;
  }

  async getMinCharge(filters) {
    const abilityInDb = await this.schema.Ability.findOne({
      name: filters.ability,
      lspId: this.lspId,
    }, 'languageCombination').lean();
    const isLanguageCombinationRequired = _.get(abilityInDb, 'languageCombination', false);
    const query = {
      'ability.name': { $in: [filters.ability] },
      'company._id': new mongoose.Types.ObjectId(filters.company),
      'currency._id': new mongoose.Types.ObjectId(filters.currencyId),
    };

    if (isLanguageCombinationRequired) {
      Object.assign(query, {
        languageCombinations: { $elemMatch: { text: filters.languageCombination } },
      });
    } else {
      Object.assign(query, { 'languageCombinations.0': { $exists: false } });
    }
    const minCharge = await this.schema.CompanyMinimumCharge.findOne(query);

    if (minCharge) {
      minCharge.minCharge = await this.currencyConverter
        .convertToLocalCurrency(minCharge.minCharge, minCharge.currency._id);
    }
    return minCharge;
  }

  getQueryParams() {
    const pipeline = [
      {
        $addFields: {
          companyHierarchy: '$company.hierarchy',
          abilityText: '$ability.name',
          languageCombinationsText: {
            $reduce: {
              input: '$languageCombinations',
              initialValue: '',
              in: {
                $cond: {
                  if: {
                    $eq: [{ $indexOfArray: ['$languageCombinations', '$$this'] }, 0],
                  },
                  then: { $concat: ['$$value', '$$this.text'] },
                  else: { $concat: ['$$value', ', ', '$$this.text'] },
                },
              },
            },
          },
          inactiveText: {
            $switch: {
              branches: [
                { case: { $eq: ['$deleted', true] }, then: 'true' },
                { case: { $eq: ['$deleted', false] }, then: 'false' },
              ],
              default: '',
            },
          },
        },
      }];
    const extraQueryParams = [
      'companyHierarchy',
      'languageCombinationsText',
      'abilityText',
      'currency.isoCode',
      'inactiveText',
    ];
    return {
      pipeline,
      extraQueryParams,
    };
  }

  async list(filters) {
    const query = {

      lspId: this.lspId,
      ..._.get(filters, 'paginationParams', {}),
    };

    this.logger.debug(`User ${this.user.email} retrieved the companyMinimumCharge list`);
    let list = [];
    const params = this.getQueryParams();

    try {
      list = await searchFactory({
        model: this.schema.CompanyMinimumCharge,
        filters: query,
        extraPipelines: params.pipeline,
        extraQueryParams: params.extraQueryParams,
        utcOffsetInMinutes: filters.__tz,
      })
        .exec();
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error performing companyMinimumCharge aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    return { list, total: list.length };
  }

  _getQueryFilters(filters) {
    let query = { lspId: this.lspId };

    if (filters && filters._id) {
      query._id = filters._id;
    }
    const pipeline = [
      {
        $addFields: {
          languageCombinations: {
            $reduce: {
              input: '$languageCombinations',
              initialValue: '',
              in: {
                $cond: {
                  if: {
                    $eq: [{ $indexOfArray: ['$languageCombinations', '$$this'] }, 0],
                  },
                  then: { $concat: ['$$value', '$$this.text'] },
                  else: { $concat: ['$$value', ', ', '$$this.text'] },
                },
              },
            },
          },
        },
      }];
    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    return { query, pipeline };
  }

  /**
   * Returns the companyMinimumCharge list as a csv file
   * @param {Object} companyMinimumChargeFilters to filter the companyMinimumCharges returned.
   */
  async export(filters) {
    const { query, pipeline } = this._getQueryFilters(filters);
    let csvStream;

    try {
      csvStream = this.schema.CompanyMinimumCharge.gridAggregation().csvStream({
        filters: query,
        utcOffsetInMinutes: filters.__tz,
        shouldPaginate: false,
        extraPipelines: pipeline,
      });
    } catch (err) {
      const message = err.message || err;

      this.logger.error(`Error transforming to csv. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    return csvStream;
  }

  async create(companyMinimumCharge) {
    delete companyMinimumCharge._id;
    const defCompanyMinimumCharge = {
      name: '',
      lspId: this.lspId,
    };
    const newCompanyMinimumCharge = new this.schema.CompanyMinimumCharge(defCompanyMinimumCharge);

    newCompanyMinimumCharge.safeAssign(companyMinimumCharge);
    await this._save(newCompanyMinimumCharge);
    return newCompanyMinimumCharge;
  }

  async update(companyMinimumCharge) {
    const _id = new mongoose.Types.ObjectId(companyMinimumCharge._id);
    const companyMinimumChargeInDb = await this.schema.CompanyMinimumCharge.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (!companyMinimumChargeInDb) {
      throw new RestError(404, { message: 'CompanyMinimumCharge does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'companyMinimumCharge',
    });
    await concurrencyReadDateChecker.failIfOldEntity(companyMinimumChargeInDb);
    companyMinimumChargeInDb.safeAssign(companyMinimumCharge);
    companyMinimumChargeInDb.deleted = _.isBoolean(companyMinimumCharge.deleted)
      ? companyMinimumCharge.deleted : false;

    await this._save(companyMinimumChargeInDb);
    return companyMinimumChargeInDb;
  }

  async _save(companyMinimumCharge) {
    try {
      const companyMinimumChargeObj = companyMinimumCharge.toObject();
      const duplicatedQuery = {
        lspId: this.lspId,
        'currency._id': new mongoose.Types.ObjectId(companyMinimumChargeObj.currency._id),
        'company._id': new mongoose.Types.ObjectId(companyMinimumChargeObj.company._id),
        'ability._id': companyMinimumChargeObj.ability._id,
      };

      if (!_.isEmpty(companyMinimumCharge.languageCombinations)) {
        duplicatedQuery.languageCombinations = {
          $elemMatch: { text: companyMinimumChargeObj.languageCombinations[0].text },
        };
      } else {
        duplicatedQuery.languageCombinations = [];
      }
      const dbRecord = await this.schema.CompanyMinimumCharge.findOne(duplicatedQuery);

      if (!_.isNil(dbRecord) && !areObjectIdsEqual(companyMinimumCharge, dbRecord)) {
        throw new Error(`Duplicated Rate found in record ${dbRecord.id}`);
      }
      await companyMinimumCharge.save(companyMinimumCharge);
    } catch (e) {
      const message = e.message || e;

      if (/^Duplicated.*/.test(e.message)) {
        throw new RestError(409, { message });
      }
      throw e;
    }
  }
}

module.exports = CompanyMinimumChargeApi;
