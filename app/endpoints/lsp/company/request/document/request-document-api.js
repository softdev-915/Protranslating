const { Types: { ObjectId } } = require('mongoose');
const _ = require('lodash');
const Promise = require('bluebird');
const rolesUtils = require('../../../../../utils/roles');
const SchemaAwareAPI = require('../../../../schema-aware-api');
const FileStorageFacade = require('../../../../../components/file-storage');
const FileStorageFactory = require('../../../../../components/file-storage/file-storage');
const { RestError } = require('../../../../../components/api-response');
const requestAPIHelper = require('../../../request/request-api-helper');
const CloudStorage = require('../../../../../components/cloud-storage');
const { ipComplies } = require('../../../../../utils/security');
const { getExtension } = require('../../../../../utils/file');
const { validObjectId, areObjectIdsEqual } = require('../../../../../utils/schema');
const PortalCatApi = require('../../../portalcat/portalcat-api');

class RequestDocumentApi extends SchemaAwareAPI {
  constructor(options, requestApi, workflowApi) {
    super(options.log, options);
    this.configuration = options.configuration;
    this.FileStorageFacade = FileStorageFacade;
    this.FileStorageFactory = FileStorageFactory;
    this.bucket = options.bucket;
    this.mock = _.get(options, 'mock');
    this.netsuite = _.get(options, 'netsuite', true);
    this.cloudStorage = new CloudStorage(this.configuration);
    this.requestApi = requestApi;
    this.workflowApi = workflowApi;
    this.portalCatApi = new PortalCatApi(this.logger, {
      sessionID: options.sessionID,
      user: this.user,
      configuration: this.configuration,
    }, this.requestApi);
  }

  getFilePrefixRegex(document) {
    if (document.final) {
      return /[a-zA-Z0-9]{24}\/request_files\/[a-zA-Z0-9]{24}\/[a-zA-Z0-9]{24}\/final/;
    }
    return /[a-zA-Z0-9]{24}\/request_files\/[a-zA-Z0-9]{24}\/[a-zA-Z0-9]{24}\//;
  }

  async zipFilesStream({
    type, res, languageCombinationId, requestId, documentId,
  }) {
    const userRoles = rolesUtils.getRoles(this.user);

    try {
      let files = [];
      const request = await this.requestApi.findOne(new ObjectId(requestId), 'no languageCombinations finalDocuments company workflows');
      if (type === 'ocr') {
        const languageCombination = request.languageCombinations
          .find((lg) => lg._id.toString() === languageCombinationId.toString());
        const document = languageCombination.documents
          .find((d) => d._id.toString() === documentId.toString());
        const cloudKey = document.OCRCloudKey;
        if (!cloudKey) throw new RestError(404, { message: 'There are no intermediate OCR-ed files for this source file. Files older than 30 days were deleted automatically.' });
        await this.cloudStorage.streamZipFolder({ res, cloudKey, zipFileName: `${document.name}_ocr.zip` });
      } else if (type === 'final') {
        files = request.finalDocuments;
      } else {
        files = requestAPIHelper.getRequestDocuments(
          request.languageCombinations,
          languageCombinationId,
        );
      }
      if (!rolesUtils.hasRole('INTERNAL-DOCUMENT_READ_ALL', userRoles)) {
        files = files.filter((d) => !d.isInternal);
      }
      files = files.map((document) => {
        if (_.isEmpty(document.cloudKey)) {
          const file = this.buildFilePath({
            document,
            requestId,
            companyId: _.get(request, 'company._id', '').toString(),
          });

          document.cloudKey = file.path;
          const extension = getExtension(document.name);

          document.path = file.path.replace(document.name, `${document._id.toString()}${extension}`);
        }
        return document;
      });
      await this.cloudStorage.streamZipFile({ res, files, zipFileName: `${request.no}-${type}.zip` });
    } catch (err) {
      const message = _.get(err, 'message', err);

      this.logger.error(`Error writing zip file. Error: ${message}`);
      throw new RestError(500, { message: 'Error generating zip file', stack: err.stack });
    }
  }

  buildFilePath({ document, requestId, companyId }) {
    const fileStorage = new this.FileStorageFacade(this.lspId, this.configuration, this.logger);
    return fileStorage.requestFilePath(companyId, requestId, document);
  }

  async findDocument({ request, companyId, documentId }) {
    if (validObjectId(request)) {
      const requestQuery = { _id: _.get(request, '_id', request), lspId: this.lspId };

      request = await this.schema.Request.findOne(requestQuery, 'languageCombinations.documents finalDocuments company').lean();
    } else if (_.isEmpty(request._id)) {
      throw new RestError(400, { message: 'Invalid ObjectId' });
    }
    const userRoles = rolesUtils.getRoles(this.user);
    const canReadInternalDocument = rolesUtils.hasRole('INTERNAL-DOCUMENT_READ_ALL', userRoles);
    const documents = requestAPIHelper.getRequestDocuments(
      request.languageCombinations,
    );
    const srcDocument = documents.find((d) => d._id.toString() === documentId);
    const finalDocument = request.finalDocuments.find((d) => d._id.toString() === documentId);
    const document = _.defaultTo(srcDocument, finalDocument);

    if (_.isNil(document)) {
      throw new Error(`Document with id: ${documentId} does not exist`);
    }
    if (document.deletedByRetentionPolicyAt) {
      // will only be executed if document.deletedByRetentionPolicyAt has a date
      throw new RestError(404, { message: `The document with name ${document.name} has been removed by document retention policy` });
    } else if (document.isInternal && !canReadInternalDocument) {
      throw new RestError(403, { message: `You cannot access to the document ${document.name} because it is internal` });
    }
    const requestId = _.get(request, '_id', request);
    const file = this.buildFilePath({ requestId, companyId, document });
    return { file, document };
  }

  async checkRemovalPermissions(request, clientIP, document) {
    const userRoles = rolesUtils.getRoles(this.user);
    const canDeleteInternalDocument = rolesUtils.hasRole('INTERNAL-DOCUMENT_DELETE_ALL', userRoles);
    const canDeleteDocuments = rolesUtils.hasRole('REQUEST_UPDATE_ALL', userRoles);

    if (!canDeleteDocuments) {
      throw new RestError(400, { message: 'You are not allowed to delete request documents' });
    }
    const companyId = _.get(request, 'company._id', request.company);

    if (!validObjectId(companyId)) {
      const err = `Invalid company id detected during document removal permission check: ${companyId}`;

      this.logger.error(err);
      throw new RestError(403, { message: err });
    }
    const cidr = _.get(request.company, 'cidr', []);

    if (cidr.length > 0) {
      const rules = cidr.map((c) => c.subnet);

      if (!ipComplies(clientIP, rules)) {
        this.logger.error(`IP ${clientIP} is not allowed to remove files`);
        throw new RestError(403, { message: `Your IP "${clientIP}" is not allowed to remove files for this company` });
      }
    }
    if (!canDeleteInternalDocument && !_.isEmpty(document)) {
      if (_.get(document, 'isInternal', false)) {
        throw new RestError(400, { message: 'You are not allowed to delete internal documents' });
      }
    }
    return true;
  }

  async deleteDocument(requestId, documentId, clientIP) {
    const query = { _id: new ObjectId(requestId), lspId: this.lspId };
    const request = await this.schema.Request.findOne(query);
    const companyId = _.get(request, 'company._id', '').toString();
    const { document } = await this.findDocument({ request, companyId, documentId });

    await this.checkRemovalPermissions(request, clientIP, document);
    let update;

    if (document.final) {
      update = {
        $set: { 'finalDocuments.$[document].deleted': true },
      };
    } else {
      update = {
        $set: { 'languageCombinations.$[].documents.$[document].deleted': true },
      };
    }
    const options = { multi: false, arrayFilters: [{ 'document._id': new ObjectId(documentId) }] };

    await this.schema.Request.findOneAndUpdate(query, update, options).exec();
    const updatedRequest = await this.requestApi.findOne(requestId);
    const allRequestDocuments = requestAPIHelper.getRequestDocuments(
      updatedRequest.languageCombinations,
    );
    const nonDeletedDocuments = allRequestDocuments.filter((d) => !d.deleted && !d.md5Hash !== 'pending');
    const deletedDocuments = allRequestDocuments.filter((d) => d.deleted);

    try {
      await this._deletePcPipelinesForDeletedFiles(documentId, request);
      await this.requestApi.afterRequestSaveHook(request, updatedRequest, false, {
        deletedDocuments: _.concat(deletedDocuments, document),
        newDocuments: nonDeletedDocuments,
      });
      this.logger.debug(`Removing file with path "${document.cloudKey}" from GCS and AWS`);
      await this.cloudStorage.deleteFile(document.cloudKey).catch((err) => {
        const message = _.get(err, 'message', err);

        this.logger.error(`Failed to delete file with id: ${documentId} from Cloud: Err ${message}`);
      });
    } catch (err) {
      this.logger.debug(`Error executing after request save for request with _id "${requestId}" ${err}`);
    }
    await Promise.map(
      updatedRequest.workflows,
      (workflow) => this.workflowApi.populateWorkflowWithCATData(workflow, updatedRequest),
    );
    return updatedRequest;
  }

  generateFilePath(params) {
    const fileStorageFacade = new this.FileStorageFacade(
      this.lspId,
      this.configuration,
      this.logger,
    );
    const { req, filename, translationRequest } = params;
    let documentId = new ObjectId().toString();
    const documents = requestAPIHelper.getRequestDocuments(
      translationRequest.languageCombinations,
      params.languageCombinationId,
    );
    const documentName = _.get(req, 'query.name');

    if (!_.isEmpty(documentName) && !_.isEmpty(documents)) {
      const duplicatedDocument = documents.find((d) => d.name === documentName);

      if (!_.isEmpty(duplicatedDocument)) {
        documentId = duplicatedDocument._id;
      }
    }
    const { companyId, requestId } = params;
    const { path } = fileStorageFacade.translationRequestFile(companyId, requestId, filename);
    return { documentId, filePath: path };
  }

  async handleFileUpload(params) {
    this.logger.debug(`Request api: Saving document into request with _id: ${params.requestId}`);
    if (_.isEmpty(params.languageCombinationId)) {
      throw new Error('Language combination id is mandatory');
    }
    await this.schema.Request.updateLanguageCombination(params);
  }

  async _assignUploadedDocumentsSegments(params) {
    const { requestId } = params;
    const request = await this.schema.Request.findById(requestId);
    return this.workflowApi.assignPortalCatSegments(null, request);
  }

  async saveRequestFinalFile(params) {
    const newDocument = _.get(params, 'newDocument');
    const isFinalFile = _.get(newDocument, 'final', false);
    const { _id, lspId } = _.get(params, 'translationRequest');
    const requestQuery = { _id, lspId };
    const isCompletedFile = _.get(newDocument, 'completed', false);

    if (isFinalFile && isCompletedFile) {
      const projection = {
        finalDocuments: 1, 'workflows._id': 1, 'workflows.srcLang': 1, 'workflows.tgtLang': 1,
      };
      const requestDb = await this.schema.Request.findOne(requestQuery, projection).lean();
      const workflow = requestDb.workflows.find((w) => areObjectIdsEqual(w, params.workflowId));

      Object.assign(newDocument, _.omit(workflow, '_id'));
      const finalFile = requestDb.finalDocuments.find((d) => d.name === newDocument.name);
      let update;
      let options;

      _.unset(newDocument, 'completed');
      if (_.isNil(finalFile)) {
        update = { $addToSet: { finalDocuments: newDocument } };
      } else {
        update = { $set: { 'finalDocuments.$[document]': newDocument } };
        options = {
          arrayFilters: [
            { 'finalDocuments.name': newDocument.name },
          ],
        };
      }
      return this.schema.Request.findOneAndUpdate(requestQuery, update, options).exec();
    }
  }

  async updateDocument({
    request, documentId, md5Hash, newCloudKey,
  }) {
    const query = {
      _id: new ObjectId(request),
      lspId: this.lspId,
    };
    return this.schema.Request.findOneAndUpdate(
      query,
      {
        $set: {
          'languageCombinations.$[].documents.$[document].cloudKey': newCloudKey,
          'languageCombinations.$[].documents.$[document].md5Hash': md5Hash,
        },
      },
      {
        multi: false,
        arrayFilters: [
          { 'document._id': new ObjectId(documentId) },
        ],
      },
    ).exec();
  }

  async _deletePcPipelinesForDeletedFiles(documentId, request) {
    if (!requestAPIHelper.isPortalCat(request)) {
      return;
    }
    const { languageCombinations } = request;
    try {
      await Promise.each(languageCombinations, async (lc) => {
        /* eslint-disable no-await-in-loop */
        /* eslint-disable no-restricted-syntax */
        let deletedDocument;
        for (const doc of lc.documents) {
          const isFileSupported = await this.portalCatApi.isFileFormatSupported(doc.name);
          if (isFileSupported && areObjectIdsEqual(doc._id, documentId)) {
            deletedDocument = doc;
            break;
          }
        }
        /* eslint-enable no-await-in-loop */
        /* eslint-enable no-restricted-syntax */
        if (_.isNil(deletedDocument)) {
          return;
        }

        const languagePairs = _.flatten(
          lc.srcLangs.map((srcLang) => lc.tgtLangs.map((tgtLang) => ({ srcLang: srcLang.isoCode, tgtLang: tgtLang.isoCode }))),
        );
        await Promise.map(languagePairs, ({ srcLang, tgtLang }) => this.portalCatApi.deleteFile({
          companyId: request.company._id,
          requestId: request._id,
          fileId: documentId,
          srcLang,
          tgtLang,
        }));
      });
    } catch (err) {
      this.logger.error(`Error removing PortalCat document with Id ${documentId}. Error: ${err.message}`);
    }
  }
}

module.exports = RequestDocumentApi;
