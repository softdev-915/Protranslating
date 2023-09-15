const mongoose = require('mongoose');
const _ = require('lodash');
const Promise = require('bluebird');
// Components
const apiResponse = require('../../../components/api-response');
const FilePathFactory = require('../../../components/file-storage/file-path-factory');
const FileStorageFacade = require('../../../components/file-storage');
const AbstractRequestAPI = require('../request/abstract-request-api');
const { checkSalesRepBelongsToCompany } = require('./opportunity-helper');
// Utils
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { getRoles, hasRole } = require('../../../utils/roles');
const { validObjectId } = require('../../../utils/schema');
const { sanitizeHTML } = require('../../../utils/security/html-sanitize');

const { RestError } = apiResponse;

class OpportunityAPI extends AbstractRequestAPI {
  constructor(options) {
    super(options);
    this.FileStorageFacade = FileStorageFacade;
    this.FilePathFactory = FilePathFactory;
  }

  _getListQueryFilters(filters) {
    let query = { lspId: this.lspId };
    const pipeline = [
      {
        $lookup: {
          from: 'companies',
          localField: 'company',
          foreignField: '_id',
          as: 'company',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'contact',
          foreignField: '_id',
          as: 'contact',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'salesRep',
          foreignField: '_id',
          as: 'salesRep',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'secondaryContacts',
          foreignField: '_id',
          as: 'secondaryContactsList',
        },
      },
      {
        $addFields: {
          company: {
            $arrayElemAt: ['$company', 0],
          },
          contact: {
            $arrayElemAt: ['$contact', 0],
          },
          salesRep: {
            $arrayElemAt: ['$salesRep', 0],
          },
          secondaryContactsText: {
            $reduce: {
              input: '$secondaryContactsList',
              initialValue: '',
              in: {
                $cond: {
                  if: {
                    $eq: [{ $indexOfArray: ['$secondaryContactsList', '$$this'] }, 0],
                  },
                  then: { $concat: ['$$value', '$$this.firstName', ' ', '$$this.lastName'] },
                  else: { $concat: ['$$value', ', ', '$$this.firstName', ' ', '$$this.lastName'] },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          srcLangText: '$srcLang.name',
          companyId: '$company._id',
          companyText: '$company.name',
          companyStatus: '$company.status',
          contactText: {
            $concat: [
              '$contact.firstName',
              ' ',
              '$contact.lastName',
            ],
          },
          salesRepText: {
            $concat: [
              '$salesRep.firstName',
              ' ',
              '$salesRep.lastName',
            ],
          },
        },
      },
      {
        $project: {
          bucketPrefixes: 0,
          company: 0,
          contact: 0,
          secondaryContacts: 0,
        },
      },
    ];

    query = Object.assign(query, _.get(filters, 'paginationParams', {}));
    const extraQueryParams = ['salesRepText', 'companyText', 'contactText', 'secondaryContactsText', 'srcLangText', 'tgtLangs.name', 'documents.name'];
    return {
      query,
      pipeline,
      extraQueryParams,
    };
  }

  /** Returns csv stream
   * @param {String} filters.id the opportunity id to filter.
   * @returns {Stream} the csv stream
   */
  async opportunityExport(filters) {
    const queryFilters = this._getExportQueryFilters(filters);
    let csvStream;
    try {
      queryFilters.query = this._addSalesRepQueryParams(queryFilters.query);
      const properFilters = _.omit(queryFilters.query, '__tz');
      csvStream = this.schema.Opportunity.gridAggregation().csvStream({
        filters: properFilters,
        extraPipelines: queryFilters.pipeline,
        utcOffsetInMinutes: filters.__tz,
        extraQueryParams: queryFilters.extraQueryParams,
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
  * Returns the opportunity list
  * @param {Object} current user making the query
  * @param {String} filters.id the opportunity id to filter.
  */
  async list(filters) {
    this.logger.debug(`User ${this.user.email} retrieved the opportunity list`);
    let list = [];
    const queryFilters = this._getListQueryFilters(filters);
    try {
      queryFilters.query = this._addSalesRepQueryParams(queryFilters.query);
      list = await this.schema.Opportunity.gridAggregation().exec({
        filters: queryFilters.query,
        extraPipelines: queryFilters.pipeline,
        extraQueryParams: queryFilters.extraQueryParams,
        utcOffsetInMinutes: filters.__tz,
      });
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error performing opportunity aggregation. Error: ${message}`);
      throw new RestError(500, { message: err, stack: err.stack });
    }
    return {
      list,
      total: list.length,
    };
  }

  async create(opportunity) {
    delete opportunity.lspId;
    let documents;
    const belongs = await checkSalesRepBelongsToCompany(
      this.user,
      this.lspId,
      opportunity,
    );
    if (!belongs) {
      throw new RestError(403, { message: 'Error saving opportunity. You are not allowed to save opportunities for this company' });
    }
    delete opportunity._id;
    opportunity.lspId = this.lspId;
    if (opportunity.notes) {
      opportunity.notes = sanitizeHTML(opportunity.notes);
    }
    const newOpportunity = new this.schema.Opportunity(opportunity);
    newOpportunity.safeAssign(opportunity);
    if (opportunity.documents.length) {
      this.logger.debug('Validating documents');
      documents = await this._checkDocuments(this.user, opportunity.documents, null, true);
      documents = this._classifyDocuments(documents, opportunity.documents);
      newOpportunity.documents = documents;
    }
    const opportunityCreated = await this._save(newOpportunity);
    try {
      await this._moveDocumentsToFinalDestination(newOpportunity, opportunityCreated);
    } catch (error) {
      try {
        // physical remove because this opportunity is actually invalid and shouldn't be stored
        await opportunityCreated.remove();
        throw new RestError(500, { message: 'Error procesing documents', stack: error.stack });
      } catch (err) {
        throw new RestError(500, { message: 'Error while trying to remove opportunity due to documents uploading error', stack: error.stack });
      }
    }
    return opportunityCreated;
  }

  async _moveDocumentsToFinalDestination(opportunity, documents, opportunityId) {
    const filePathFactory = new this.FilePathFactory(this.lspId, this.configuration, this.logger);
    if (documents.length) {
      try {
        await this._moveFiles(opportunity, documents, (doc) => {
          const fileParams = [opportunity.company, opportunityId, doc];
          return filePathFactory.opportunityFile(...fileParams);
        });
      } catch (e) {
        if (e.code) {
          throw e;
        }
        const message = e.message || e;
        this.logger.error(`Error moving files: Error ${message}`);
        throw new RestError(500, { message: 'Error editing opportunity', stack: e.stack });
      }
    }
  }

  async update(opportunity) {
    if (opportunity.notes) {
      opportunity.notes = sanitizeHTML(opportunity.notes);
    }
    delete opportunity.lspId;
    let documents = [];
    const belongs = await checkSalesRepBelongsToCompany(
      this.user,
      this.lspId,
      opportunity,
    );
    if (!belongs) {
      throw new RestError(403, { message: 'Error saving opportunity. You are not allowed to save opportunities for this company' });
    }
    const opportunityId = new mongoose.Types.ObjectId(opportunity._id);
    if (validObjectId(opportunityId)) {
      const opportunityInDb = await this.schema.Opportunity.findOne({
        _id: opportunityId,
        lspId: this.lspId,
      });
      if (!opportunityInDb) {
        throw new RestError(403, { message: 'Error saving opportunity. You are not allowed to save opportunities for this company' });
      }
      const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
        entityName: 'opportunity',
      });
      await concurrencyReadDateChecker.failIfOldEntity(opportunityInDb);
      const deletedDocuments = opportunity.documents.filter((d) => d.removed);
      let newDocuments;
      if (opportunity.documents.length) {
        this.logger.debug('Validating documents');
        newDocuments = opportunity.documents.filter((d) => d.isNew);
        documents = await this._checkDocuments(this.user, newDocuments, null, false);
        documents = this._classifyDocuments(documents, newDocuments);
      }
      if (deletedDocuments && deletedDocuments.length) {
        try {
          await this.deletePhysicalFiles(opportunity, deletedDocuments);
        } catch (e) {
          // An error was thrown while deleting the physical files, the http request should not fail
          // but we should log an error.
          const message = e.message || e;
          this.logger.error(`Error while removing opportunity files for opportunity with no: ${opportunity.no}. Error: ${message}`);
        }
      }
      let opportunityUpdated;
      try {
        await this._moveDocumentsToFinalDestination(opportunity, documents, opportunityInDb._id);
        opportunityInDb.safeAssign(opportunity);
        opportunityUpdated = await this._save(opportunityInDb);
      } catch (error) {
        throw error;
      }
      return opportunityUpdated;
    }
    throw new RestError(400, { message: 'Invalid ObjectId' });
  }

  async deletePhysicalFiles(opportunity, deletedDocuments) {
    const filePathFactory = new this.FilePathFactory(this.lspId, this.configuration, this.logger);
    const fileStorageFacade = new this.FileStorageFacade(
      this.lspId,
      this.configuration,

      this.logger,
    );
    const companyId = _.get(opportunity, 'company._id', opportunity.company).toString();
    const opportunityId = opportunity._id.toString();
    await Promise.map(deletedDocuments, (d) => {
      const fileStorage = fileStorageFacade.opportunityFile(companyId, opportunityId, d, true);
      return fileStorage.delete();
    });

    await Promise.mapSeries(deletedDocuments, (d) => {
      const bucketFilePath = filePathFactory.opportunityFile(
        companyId,
        opportunityId,

        d,

        true,
      );

      if (typeof bucketFilePath !== 'string' || bucketFilePath.length < 93) {
        this.logger.debug(`Cloud Storage: failed to remove file for opportunity ${opportunityId}, invalid file path Key: ${bucketFilePath}`);
        // incorrect path, skip
        return Promise.resolve();
      }

      this.logger.debug(`Cloud Storage: Deleting path Key: ${bucketFilePath}`);
      return this.cloudStorage.deleteFile(bucketFilePath);
    });
  }

  async _save(opportunity) {
    try {
      await opportunity.save();
      const opportunityPopulated = await this._findOne({
        _id: opportunity._id,
        lspId: this.lspId,
      });
      return opportunityPopulated;
    } catch (err) {
      if (err.message.match(/.*duplicate key*./)) {
        this.logger.debug(`User ${this.user.email} couldn't save the opportunity: ${opportunity.name} due to err: duplicated key`);
        throw new RestError(409, { message: `Opportunity ${opportunity.name} already exists` });
      }
      this.logger.debug(`User ${this.user.email} couldn't save the opportunity: ${opportunity.name} due to err: ${err.message}`);
      throw new RestError(500, { message: err.message });
    }
  }

  _addSalesRepQueryParams(query) {
    const roles = getRoles(this.user);
    const canReadOwn = hasRole('OPPORTUNITY_READ_OWN', roles);
    const canReadAll = hasRole('OPPORTUNITY_READ_ALL', roles);
    // Users with role OPPORTUNITY_READ_OWN can only see companies where they are a sales rep of
    if (!canReadAll && canReadOwn) {
      query.salesRep = new mongoose.Types.ObjectId(this.user._id);
    }
    return query;
  }

  async _findOne(query) {
    const opportunityFound = await this.schema.Opportunity.findOneAndPopulate(query);
    if (opportunityFound) {
      this.logger.debug(`User ${this.user.email} retrieved an opportunity`);
      return opportunityFound;
    }
    throw new RestError(404, { message: `Opportunity with id: ${query._id} was not found` });
  }

  _getExportQueryFilters(filters) {
    let query = { lspId: this.lspId };
    const pipeline = [
      {
        $lookup: {
          from: 'companies',
          localField: 'company',
          foreignField: '_id',
          as: 'company',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'contact',
          foreignField: '_id',
          as: 'contact',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'salesRep',
          foreignField: '_id',
          as: 'salesRep',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'secondaryContacts',
          foreignField: '_id',
          as: 'secondaryContactList',
        },
      },
      {
        $addFields: {
          company: {
            $arrayElemAt: ['$company', 0],
          },
          contact: {
            $arrayElemAt: ['$contact', 0],
          },
          salesRep: {
            $arrayElemAt: ['$salesRep', 0],
          },
          secondaryContacts: {
            $reduce: {
              input: '$secondaryContactList',
              initialValue: '',
              in: {
                $cond: {
                  if: {
                    $eq: [{ $indexOfArray: ['$secondaryContactList', '$$this'] }, 0],
                  },
                  then: { $concat: ['$$value', '$$this.firstName', ' ', '$$this.lastName'] },
                  else: { $concat: ['$$value', ', ', '$$this.firstName', ' ', '$$this.lastName'] },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          srcLang: '$srcLang.name',
          salesRepText: {
            $concat: [
              '$salesRep.firstName',
              ' ',
              '$salesRep.lastName',
            ],
          },
          srcLangText: '$srcLang.name',
          secondaryContactsText: '$secondaryContacts',
          company: '$company.name',
          contact: {
            $concat: [
              '$contact.firstName',
              ' ',
              '$contact.lastName',
            ],
          },
          salesRep: {
            $concat: [
              '$salesRep.firstName',
              ' ',
              '$salesRep.lastName',
            ],
          },
          companyText: '$company.name',
          contactText: {
            $concat: [
              '$contact.firstName',
              ' ',
              '$contact.lastName',
            ],
          },
        },
      },
      {
        $project: {
          bucketPrefixes: 0,
        },
      },
    ];
    query = Object.assign(query, filters);
    const extraQueryParams = ['srcLangText', 'secondaryContactsText', 'documents.name', 'tgtLangs.name'];
    return {
      query,
      pipeline,
      extraQueryParams,
    };
  }

  async retrieveById(_id) {
    const opportunityId = new mongoose.Types.ObjectId(_id);
    const query = {
      _id: opportunityId,
      lspId: this.lspId,
    };
    this.logger.debug(`User ${this.user.email} retrieved an opportunity by id`);
    const roles = getRoles(this.user);
    const canReadOwn = hasRole('OPPORTUNITY_READ_OWN', roles);
    const canReadAll = hasRole('OPPORTUNITY_READ_ALL', roles);
    // Users with role OPPORTUNITY_READ_OWN can only see companies where they are a sales rep of
    if (!canReadAll && canReadOwn) {
      query.salesRep = this.user._id;
    }
    if (validObjectId(opportunityId)) {
      const opportunityFound = await this._findOne(query);
      if (!opportunityFound) {
        throw new RestError(404, { message: `Opportunity with _id ${_id} was not found` });
      }
      return opportunityFound;
    }
    throw new RestError(400, { message: 'Invalid ObjectId' });
  }
}

module.exports = OpportunityAPI;
