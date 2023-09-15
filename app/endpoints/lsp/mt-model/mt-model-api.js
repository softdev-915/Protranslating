// eslint-disable-next-line global-require
const { Types: { ObjectId } } = global.mongoose || require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { getRoles, hasRole } = require('../../../utils/roles');

const { RestError } = apiResponse;
const CONTACT_USER_TYPE = 'Contact';

class MtModelApi extends SchemaAwareAPI {
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

  _getMtModelQuery(filters) {
    const query = {
      lspId: this.lspId,
    };

    if (!_.isNil(_.get(filters, '_id'))) {
      query._id = filters._id;
    }
    return Object.assign(query, _.get(filters, 'paginationParams', {}));
  }

  /**
   * Returns the model list
   * @param {Object} filters to filter the mt models returned.
   */
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the mt model list`);
    let list = [];
    const query = this._getMtModelQuery(filters);
    const id = _.get(filters, '_id');
    if (!_.isNil(id)) {
      list = await this.schema.MtModel.findWithDeleted({
        _id: id,
        lspId: this.lspId,
      }).lean();
      if (_.isNil(_.get(list, '[0]'))) {
        throw new RestError(404, { message: `MT Model ${id} does not exist` });
      }
    } else {
      try {
        const roles = getRoles(this.user);
        const isContact = this.user.type === CONTACT_USER_TYPE;
        const canReadCompany = hasRole('MT-TRANSLATOR_READ_COMPANY', roles);
        const canReadAll = hasRole('MT-TRANSLATOR_READ_ALL', roles);
        if (isContact && canReadCompany && !canReadAll) {
          Object.assign(query, {
            $or: [
              { 'client._id': new ObjectId(_.get(this.user, 'company._id')) },
              { 'client._id': { $exists: false } },
            ],
          });
        }
        list = await this.schema.MtModel.gridAggregation().exec({
          filters: query,
          utcOffsetInMinutes: filters.__tz,
        });
      } catch (err) {
        const message = err.message || err;
        this.logger.error(`Error performing mt model aggregation. Error: ${message}`);
        throw new RestError(500, { message: err, stack: err.stack });
      }
    }
    return {
      list,
      total: list.length,
    };
  }

  /**
   * Returns the model list as a csv file
   * @param {Object} filters to filter the mt models returned.
   */
  async mtModelExport(filters) {
    let csvStream;
    const query = this._getMtModelQuery(filters);
    try {
      csvStream = this.schema.MtModel.gridAggregation().csvStream({
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

  async create(user, model) {
    const mtModelInDb = await this.schema.MtModel.findOne({
      code: model.code,
      lspId: this.lspId,
    });

    if (!_.isNil(mtModelInDb)) {
      throw new RestError(409, { message: 'Model already exists' });
    }
    delete model._id;
    const defModel = {
      code: '',
      lastTrainedAt: new Date(),
      sourceLanguage: '',
      targetLanguage: '',
      createdBy: user.email,
      isGeneral: false,
      industry: null,
      client: null,
      lspId: this.lspId,
      isProductionReady: false,
    };
    const newModel = new this.schema.MtModel(defModel);
    newModel.safeAssign(model);
    await newModel.save();
    return newModel;
  }

  async update(user, model) {
    const _id = new ObjectId(model._id);
    const mtModelInDb = await this.schema.MtModel.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (_.isNil(mtModelInDb)) {
      throw new RestError(404, { message: 'Model does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(user, this.logger, {
      entityName: 'mtModel',
    });
    await concurrencyReadDateChecker.failIfOldEntity(mtModelInDb);
    mtModelInDb.safeAssign(model);
    const mtModelUpdated = await mtModelInDb.save();
    return mtModelUpdated;
  }
}

module.exports = MtModelApi;
