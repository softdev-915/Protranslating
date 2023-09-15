const mongoose = require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { validObjectId, areObjectIdsEqual } = require('../../../utils/schema');
const { hasRole, getRoles } = require('../../../utils/roles');
const { searchFactory } = require('../../../utils/pagination');
const { parsePaginationFilter } = require('../../../utils/request');

const { RestError } = apiResponse;
const METADATA_PROJECTION = {
  updatedBy: 1,
  createdBy: 1,
  deletedBy: 1,
  restoredBy: 1,
  deletedAt: 1,
  restoredAt: 1,
  createdAt: 1,
  updatedAt: 1,
  deleted: 1,
};
const ADD_FIELDS_AGGREGATION = [{
  $addFields: {
    vendor: { $arrayElemAt: ['$vendor', 0] },
    abilityText: '$ability.name',
    languageCombinations: {
      $reduce: {
        input: '$languageCombinations',
        initialValue: '',
        in: {
          $cond: {
            if: { $eq: [{ $indexOfArray: ['$languageCombinations', '$$this'] }, 0] },
            then: { $concat: ['$$value', '$$this.text'] },
            else: { $concat: ['$$value', ', ', '$$this.text'] },
          },
        },
      },
    },
  },
}, {
  $addFields: {
    vendorName: { $concat: ['$vendor.firstName', ' ', '$vendor.lastName'] },
  },
}];
const EXPORT_ADD_FIELDS_AGGREGATION = [{
  $addFields: {
    vendor: { $arrayElemAt: ['$vendor', 0] },
    abilityText: '$ability.name',
    languageCombinations: {
      $reduce: {
        input: '$languageCombinations',
        initialValue: '',
        in: {
          $cond: {
            if: { $eq: [{ $indexOfArray: ['$languageCombinations', '$$this'] }, 0] },
            then: { $concat: ['$$value', '$$this.text'] },
            else: { $concat: ['$$value', ', ', '$$this.text'] },
          },
        },
      },
    },
  },
}, {
  $addFields: {
    vendorText: { $concat: ['$vendor.firstName', ' ', '$vendor.lastName'] },
  },
}, {
  $addFields: {
    vendor: { $concat: ['$vendor.firstName', ' ', '$vendor.lastName'] },
  },
}];

class VendorMinimumChargeAPI extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.logger = logger;
    this.configuration = _.get(options, 'configuration');
  }

  _getExportQueryFilters(filters) {
    let query = { lspId: this.lspId };

    if (!_.isEmpty(_.get(filters, '_id', ''))) {
      query._id = filters._id;
    }
    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    query.filter = _.defaultTo(query.filter, {});
    const filterJSON = parsePaginationFilter(query.filter);
    const { vendorName, abilityText } = filterJSON;

    filterJSON.vendorText = vendorName;
    query.filter = JSON.stringify(_.omit(filterJSON, ['vendorName']));
    const PROJECTION = {
      vendorText: 1,
      'ability.name': 1,
      languageCombinations: 1,
      rate: 1,
      vendor: 1,
    };
    const pipeline = [{
      $lookup: {
        from: 'users',
        localField: 'vendor',
        foreignField: '_id',
        as: 'vendor',
      },
    }].concat(EXPORT_ADD_FIELDS_AGGREGATION);

    if (!_.isEmpty(abilityText)) {
      pipeline.push({
        $match: {
          abilityText: new RegExp(abilityText),
        },
      });
    }
    pipeline.push({ $project: Object.assign(PROJECTION, METADATA_PROJECTION) });
    return {
      query,
      pipeline,
      extraQueryParams: ['abilityText', 'languageCombinations', 'vendorText'],
    };
  }

  _getQueryFilters(filters) {
    let query = { lspId: this.lspId };

    if (!_.isEmpty(_.get(filters, '_id', ''))) {
      query._id = filters._id;
    }

    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    const pipeline = [{
      $lookup: {
        from: 'users',
        localField: 'vendor',
        foreignField: '_id',
        as: 'vendor',
      },
    },
    ...ADD_FIELDS_AGGREGATION,
    {
      $addFields: {
        vendorName: { $concat: ['$vendor.firstName', ' ', '$vendor.lastName'] },
      },
    },
    {
      $addFields: {
        vendorName: { $concat: ['$vendor.firstName', ' ', '$vendor.lastName'] },
      },
    },
    {
      $project: {
        vendor: 1,
        vendorName: 1,
        abilityText: 1,
        languageCombinations: 1,
        rate: 1,
        ...METADATA_PROJECTION,
      },
    }];
    return {
      query,
      pipeline,
      extraQueryParams: ['vendorName', 'abilityText', 'languageCombinations'],
    };
  }

  /**
   * Returns the vendor minimum charge list as a csv file
   * @param {Object} VendorMinimumChargeFilters to filter the groups returned.
   */
  /**
   * Returns the companyMinimumCharge list as a csv file
   * @param {Object} companyMinimumChargeFilters to filter the companyMinimumCharges returned.
   */
  async vendorMinimumChargeExport(filters) {
    const { query, pipeline, extraQueryParams } = this._getExportQueryFilters(filters);
    let csvStream;

    try {
      csvStream = this.schema.VendorMinimumCharge.gridAggregation().csvStream({
        filters: query,
        extraPipelines: pipeline,
        extraQueryParams,
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
   * Returns the vendor minimum charge list
   * @param {Object} VendorMinimumCharge to filter the vendor minimum charge returned.
   * @param {String} VendorMinimumCharge.id the vendor minimum charge id to filter.
   */
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the vendor minimum charge list`);
    let list = [];
    const queryFilters = this._getQueryFilters(filters);

    try {
      list = await searchFactory({
        model: this.schema.VendorMinimumCharge,
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

  async retrieveById(vendorMinimumChargeId) {
    if (!validObjectId(vendorMinimumChargeId)) {
      throw new RestError(400, { message: 'Invalid ObjectId' });
    }
    const vendorMinimumCharge = await this.schema.VendorMinimumCharge.findOneWithDeleted({
      _id: vendorMinimumChargeId,
      lspId: this.lspId,
    }).populate({ path: 'vendor', select: ['_id', 'firstName', 'lastName', 'email'], options: { withDeleted: true } });

    if (_.isNil(vendorMinimumCharge)) {
      throw new RestError(404, { message: `Vendor Minimum Charge with _id ${vendorMinimumChargeId} was not found` });
    }
    return vendorMinimumCharge;
  }

  async create(vendorMinimumCharge) {
    const defVendorMinimumCharge = {
      name: '',
      lspId: this.lspId,
      createdBy: this.user.email,
    };
    const newVendorMinimumCharge = new this.schema.VendorMinimumCharge(defVendorMinimumCharge);

    newVendorMinimumCharge.safeAssign(_.omit(vendorMinimumCharge, ['_id']));
    newVendorMinimumCharge.ability._id = new mongoose.Types.ObjectId(
      newVendorMinimumCharge.ability._id,
    );
    const vendorMinimumChargeCreated = await this._save(newVendorMinimumCharge);
    return vendorMinimumChargeCreated;
  }

  async update(vendorMinimumCharge) {
    const _id = new mongoose.Types.ObjectId(vendorMinimumCharge._id);
    const vendorMinimumChargeDB = await this.schema.VendorMinimumCharge.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (!vendorMinimumChargeDB) {
      throw new RestError(404, { message: 'Vendor Minimum Charge does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'vendorMinimumCharge',
    });
    await concurrencyReadDateChecker.failIfOldEntity(vendorMinimumChargeDB);
    vendorMinimumChargeDB.ability._id = new mongoose.Types.ObjectId(vendorMinimumCharge.ability._id);
    vendorMinimumChargeDB.safeAssign(vendorMinimumCharge);
    vendorMinimumChargeDB.deleted = _.get(vendorMinimumChargeDB, 'deleted', false);
    const vendorMinimumChargeUpdated = await this._save(vendorMinimumChargeDB);
    return vendorMinimumChargeUpdated;
  }

  async _save(vendorMinimumCharge) {
    const vendorMinimumChargeObj = vendorMinimumCharge.toObject();
    try {
      const query = {
        lspId: this.lspId,
        vendor: vendorMinimumChargeObj.vendor,
        'ability._id': vendorMinimumChargeObj.ability._id,
      };
      if (!_.isEmpty(vendorMinimumChargeObj.languageCombinations)) {
        query.languageCombinations = {
          $elemMatch: { text: vendorMinimumChargeObj.languageCombinations[0].text },
        };
      } else {
        query.languageCombinations = [];
      }
      const dbRecord = await this.schema.VendorMinimumCharge.findOneWithDeleted(query);
      if (!_.isNil(dbRecord) && !areObjectIdsEqual(vendorMinimumChargeObj, dbRecord)) {
        throw new Error(`Duplicated Rate found in record ${dbRecord.id}`);
      }
      return vendorMinimumCharge.save(vendorMinimumChargeObj);
    } catch (e) {
      const message = e.message || e;
      this.logger.debug(`User ${this.user.email} couldn't save the vendorMinimumCharge: ${vendorMinimumCharge._id} due to err: ${message}`);
      if (/^Duplicated.*/.test(e.message)) {
        throw new RestError(409, { message });
      }
      throw e;
    }
  }

  async retrieveProviderMinimumCharge(filters, skipRoleCheck = false) {
    if (!skipRoleCheck) {
      this._performRoleCheck(filters);
    }
    const query = [{ lspId: this.lspId }];

    query.push({ vendor: new mongoose.Types.ObjectId(filters.vendorId) });
    if (!_.isEmpty(_.get(filters, 'ability', ''))) {
      query.push({ 'ability.name': filters.ability });
    }
    if (!_.isEmpty(_.get(filters, 'languageCombination', []))) {
      query.push({
        $or: [{
          languageCombinations: { $elemMatch: { text: filters.languageCombination } },
        }, {
          languageCombinations: { $size: 0 },
        }],
      });
    }
    const providerMinimumCharge = await this.schema.VendorMinimumCharge.findOne({
      $and: query,
    }).select('rate');

    if (_.isNil(providerMinimumCharge)) {
      throw new RestError(404, { message: `Vendor Minimum Charge with vendorId ${filters.vendorId} was not found` });
    }
    return providerMinimumCharge;
  }

  _performRoleCheck(filters) {
    const userRoles = getRoles(this.user);
    const userIdString = this.user._id.toString();
    if (
      [
        hasRole('TASK_READ_OWN', userRoles),
        !hasRole('TASK_READ_ALL', userRoles),
        userIdString !== filters.vendorId,
      ].every((cond) => cond)) {
      throw new RestError(403, {
        message: `User has no access to provider ${filters.vendorId}`,
      });
    }
  }
}

module.exports = VendorMinimumChargeAPI;
