const mongoose = require('mongoose');
const Promise = require('bluebird');
const _ = require('lodash');
const SchemaAwareAPI = require('../../schema-aware-api');
const { RestError } = require('../../../components/api-response');
const CloudStorage = require('../../../components/cloud-storage');
const FileStorageFacade = require('../../../components/file-storage');
const { ipComplies } = require('../../../utils/security');
const genericLogger = require('../../../components/log/logger');

class AbstractRequestAPI extends SchemaAwareAPI {
  constructor({
    user, configuration, log, mock, flags,
  }) {
    let logger;

    if (log) {
      logger = log;
    } else {
      logger = genericLogger;
    }
    super(logger, { user, flags });
    this.configuration = configuration;
    this.FileStorageFacade = FileStorageFacade;
    this.cloudStorage = new CloudStorage(configuration, logger);
    this.mock = mock;
    this.requestReadModel = this.schema.RequestSecondary;
  }

  _checkCompany(companyId, lspId) {
    return this.schema.Company.findOne({
      _id: companyId,
      lspId,
    }).then((company) => {
      if (!company) {
        throw new RestError(400, { message: `Company ${companyId} does not exist` });
      }

      return company;
    });
  }

  _classifyDocuments(prospectDocuments, documentsIds) {
    // Classify files
    const classifiedDocs = prospectDocuments.map((prospectDoc) => {
      const docFound = documentsIds.filter((document) => document._id === prospectDoc._id.toString());

      prospectDoc.final = false;
      if (docFound && docFound[0]) {
        prospectDoc.final = docFound[0].final;
        prospectDoc._doc.isReference = docFound[0].isReference;
        prospectDoc._doc.isInternal = docFound[0].isInternal;
      }

      return prospectDoc;
    });

    return classifiedDocs;
  }

  _checkDocumentsCIDR(documents, cidr) {
    documents.forEach((d) => {
      if (d.ip) {
        // only check cidr for document that have ip
        if (cidr) {
          const rules = cidr.map((c) => c.subnet);

          if (!ipComplies(d.ip, rules)) {
            throw new RestError(403, { message: `Document "${d.name}" was uploaded from IP "${d.ip}" which is not allowed to upload files for this company` });
          }
        } else {
          throw new RestError(403, { message: `Document "${d.name}" was uploaded from IP "${d.ip}" which is not allowed to upload files for this company` });
        }
      }
    });

    return true;
  }

  _checkDocuments(user, documentsIds, allDocs, isNewRequest) {
    const lspId = user.lsp._id;

    return this.schema.DocumentProspect.find({
      _id: {
        $in: documentsIds.map((d) => mongoose.Types.ObjectId(d._id)),
      },
      createdBy: user.email,
      lspId,
    }).then((documents) => {
      if (documents.length !== documentsIds.length) {
        throw new RestError(400, { message: 'Some documents were not found' });
      }
      if (isNewRequest) {
        const documentsToCompare = allDocs || documents;
        const docNames = documentsToCompare.map((d) => d.name);
        const repeated = _.filter(docNames, (value, index, iteratee) => _.includes(iteratee, value, index + 1));

        if (repeated && repeated.length) {
          throw new RestError(400, { message: `Document names repeated: ${repeated.join(',')}` });
        }
      }

      return documents;
    });
  }

  async _moveFiles(newTranslationRequest, documents, awsPathStrategy) {
    const fileMovePromises = [];
    const fileUploadPromises = [];

    documents.forEach((doc, index) => {
      const newFileKey = awsPathStrategy(doc);

      fileUploadPromises.push(() => {
        this.logger.debug(`AWS Bucket: Moving ${newFileKey}`);

        return this.cloudStorage.moveFile(doc.cloudKey, newFileKey, null, doc.size).then(() => {
          documents[index].cloudKey = newFileKey;
        });
      });
    });
    try {
      await Promise.resolve(fileUploadPromises).mapSeries((f) => f());
    } catch (e) {
      this.logger.error(`Error uploading files to AWS bucket. Error: ${e.message}`);
      throw new RestError(500, { message: 'An error ocurred upon uploading files to bucket', stack: e.stack });
    }
    try {
      await this.schema.DocumentProspect.deleteMany({
        _id: {
          $in: documents,
        },
      });
    } catch (e) {
      // in this case we will not fail but we're going to log the error anyway.
      this.logger.error(`Error deleting prospect documents. Error: ${e.message}`);
    }

    return fileMovePromises;
  }

  async _moveUploadedFiles(translationRequest, lspId, documents, toPathFun) {
    const fileMovePromises = [];
    const fileStorageFacade = new this.FileStorageFacade(lspId, this.configuration, this.logger);

    documents.forEach((doc) => {
      const fileStorage = fileStorageFacade.documentProspectFile(doc);
      const newFileNamePath = toPathFun(doc);

      fileMovePromises.push(fileStorage.move(newFileNamePath));
    });
    try {
      await Promise.all(fileMovePromises);
    } catch (e) {
      this.logger.error(`Error moving files. Error: ${e.message}`);
      throw new RestError(500, { message: 'Error with uploaded files' });
    }
    try {
      const uploadedDocuments = translationRequest.documents;

      await this.schema.DocumentProspect.deleteMany({
        _id: {
          $in: uploadedDocuments,
        },
      });
    } catch (e) {
      // in this case we will not fail but we're going to log the error anyway.
      this.logger.error(`Error deleting prospect documents. Error: ${e.message}`);
    }

    return fileMovePromises;
  }

  markDeletedDocuments(request, translationRequest, deletedDocuments) {
    // Only non deleted documents come from the frontend
    request.documents.forEach((d) => {
      if (!translationRequest.documents.find((doc) => doc.name === d.name)) {
        translationRequest.documents.push(d);
      }
    });
    // Mark documents as deleted, don't delete from the filesystem
    if (deletedDocuments.length) {
      translationRequest.documents.forEach((d) => {
        d.deleted = d.removed || false;

        return d;
      });
    }
  }
}

module.exports = AbstractRequestAPI;
