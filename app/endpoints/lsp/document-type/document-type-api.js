const mongoose = require('mongoose');
const _ = require('lodash');
const apiResponse = require('../../../components/api-response');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { validObjectId } = require('../../../utils/schema');

const { RestError } = apiResponse;

class DocumentTypeApi extends SchemaAwareAPI {
  constructor(logger, options) {
    super(logger, options);
    this.configuration = _.get(options, 'configuration');
  }

  _getQueryFilters(filters) {
    let query = {};

    if (filters && filters._id) {
      query._id = filters._id;
    }

    query = Object.assign(query, {
      lspId: this.lspId,
    }, _.get(filters, 'paginationParams', {}));
    return query;
  }

  /**
 * Returns the document type list as a csv file
 * @param {Object} documentTypeFilters to filter the groups returned.
 */
  async documentTypeExport(filters) {
    let csvStream;
    const queryFilters = this._getQueryFilters(filters);

    try {
      csvStream = this.schema.DocumentType.gridAggregation().csvStream({
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

  /**
   * Returns the document type list
   * @param {Object} documentTypeFilters to filter the document type returned.
   * @param {String} documentTypeFilters.id the document type's id to filter.
   */
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the Document Type list`);
    let list = [];
    const query = this._getQueryFilters(filters);

    try {
      list = await this.schema.DocumentType.gridAggregation().exec({
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

  async retrieveById(documentTypeId) {
    if (!validObjectId(documentTypeId)) {
      throw new RestError(400, { message: 'Invalid ObjectId' });
    }
    const deliveryMethod = await this.schema.DocumentType.findOneWithDeleted({
      _id: documentTypeId,
      lspId: this.lspId,
    });

    if (!deliveryMethod) {
      throw new RestError(404, { message: `Document Type with _id ${documentTypeId} was not found` });
    }
    return deliveryMethod;
  }

  async create(documentType) {
    delete documentType._id;
    documentType.lspId = this.lspId;
    const newDocumentType = new this.schema.DocumentType(documentType);

    newDocumentType.safeAssign(documentType);
    const documentTypeInDb = await this.schema.DocumentType.findOneWithDeleted({
      name: documentType.name,
      lspId: this.lspId,
    });

    if (!_.isNil(documentTypeInDb)) {
      throw new RestError(404, { message: 'Document Type does not exist' });
    }
    const documentTypeCreated = await newDocumentType.save();
    return documentTypeCreated;
  }

  async update(documentType) {
    if (!validObjectId(documentType._id)) {
      throw new RestError(400, { message: 'Invalid ObjectId' });
    }
    const _id = new mongoose.Types.ObjectId(documentType._id);
    const documentTypeInDb = await this.schema.DocumentType.findOneWithDeleted({
      _id,
      lspId: this.lspId,
    });

    if (!documentTypeInDb) {
      throw new RestError(404, { message: 'Document Type does not exist' });
    }

    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
      entityName: 'documentType',
    });
    await concurrencyReadDateChecker.failIfOldEntity(documentTypeInDb);
    const hasNameChanged = documentTypeInDb.name !== documentType.name;

    documentTypeInDb.safeAssign(documentType);
    try {
      const documentTypeUpdated = await documentTypeInDb.save(documentType);

      if (hasNameChanged) {
        await documentTypeInDb.updateEmbeddedEntities();
      }
      return documentTypeUpdated;
    } catch (err) {
      this.logger.debug(`Error ocurred upon saving new document type: ${err.message}`);
      if (err.message.match('duplicate')) {
        throw new RestError(500, { message: `${documentType.name} already exists` });
      }
      throw new RestError(500, { message: 'Error ocurred upon saving new document type' });
    }
  }
}

module.exports = DocumentTypeApi;
