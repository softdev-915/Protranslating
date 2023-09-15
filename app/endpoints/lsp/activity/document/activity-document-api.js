const mongoose = require('mongoose');
const _ = require('lodash');
const Promise = require('bluebird');
const { buildResponseDocument } = require('../activity-api-helper');
const SchemaAwareAPI = require('../../../schema-aware-api');
const fileUtils = require('../../../../utils/file');
const FileStorageFactory = require('../../../../components/file-storage');
const FileStorageFacade = require('../../../../components/file-storage');
const FilePathFactory = require('../../../../components/file-storage/file-path-factory');
const { RestError } = require('../../../../components/api-response');
const VersionableFileStorage = require('../../../../components/file-storage/versionable-file-storage-facade');
const { validObjectId } = require('../../../../utils/schema');
const ActivityVersionableDocument = require('../../../../utils/document/activity-versionable-document');
const CloudStorage = require('../../../../components/cloud-storage');
const { sendResponse, sendErrorResponse } = require('../../../../components/api-response');

const { ObjectId } = mongoose.Types;
const ACTIVITY_EMAIL_TYPE = 'Email';
const ACTIVITY_FEEDBACK_TYPE = 'Feedback';
const EMAIL_FILE_PREFIX_REGEX = /[a-zA-Z0-9]{24}\/activity_files\/[a-zA-Z0-9]{24}\/[a-zA-Z0-9]{24}./;
const FEEDBACK_FILE_PREFIX_REGEX = /[a-zA-Z0-9]{24}\/activity_files\/[a-zA-Z0-9]{24}\/[a-zA-Z0-9]{24}\/[a-zA-Z0-9]{24}./;

class ActivityDocumentAPI extends SchemaAwareAPI {
  constructor(user, configuration, logger) {
    super(logger, { user });
    this.configuration = configuration;
    this.FileStorageFactory = FileStorageFactory;
    this.FilePathFactory = FilePathFactory;
  }

  async createDocument(user, activityIdToEdit, file) {
    if (activityIdToEdit !== 'undefined' && !mongoose.isValidObjectId(activityIdToEdit)) {
      throw new RestError(400, { message: `Not valid activity id ${activityIdToEdit}` });
    }
    const { lspId } = this;
    const fileStorageFactory = new this.FileStorageFactory(
      lspId.toString(),
      this.configuration,

      this.logger,
    );
    const documentProspect = new this.schema.ActivityDocumentProspect({
      lspId,
      name: file.originalname,
      mime: file.mimetype,
      encoding: file.encoding,
      size: file.size,
      activityId: activityIdToEdit,
    });
    const fileStored = await documentProspect.save();
    let extension = fileUtils.getExtension(fileStored.name);

    if (extension.length) {
      extension = `${extension}`;
    }
    const fileStorage = fileStorageFactory
      .entityDocumentProspect(activityIdToEdit, 'activityFiles', documentProspect, extension);

    await fileStorage.save(file.buffer);

    return fileStored;
  }

  async deleteDocument(activityIdToEdit, documentId, filename) {
    if (!validObjectId(documentId)) {
      throw new RestError(400, { message: `Not valid Document id ${documentId}` });
    }
    const cloudStorage = new CloudStorage(this.configuration);
    const filePathFactory = new this.FilePathFactory(
      this.lspId,
      this.configuration,
      this.logger,
    );
    const documentPath = filePathFactory.activityFeedbackDocument(documentId, filename);

    await cloudStorage.deleteFile(documentPath).catch(async (err) => {
      if (!_.isEmpty(_.defaultTo(activityIdToEdit, ''))) {
        const { path: nonRenamedDocumentPath } = await this.buildActivityNonRenamedFilePath(
          activityIdToEdit,
          documentId,
        );

        await cloudStorage.deleteFile(nonRenamedDocumentPath).catch((e) => {
          const message = _.get(e, 'message', e);

          this.logger.error(`Failed to delete file with id: ${documentId} from Cloud: Err ${message}`);
          throw new RestError(500, { message: `Error deleting file for document ${documentId}` });
        });
      } else {
        const message = _.get(err, 'message', err);

        this.logger.error(`Failed to delete file with id: ${documentId} from Cloud: Err ${message}`);
        throw new RestError(500, { message: `Error deleting file for document ${documentId}` });
      }
    });

    let document;

    try {
      if (validObjectId(activityIdToEdit)) {
        const isDocumentSaved = await this.isDocumentSaved(activityIdToEdit, documentId);

        if (isDocumentSaved) {
          const versionableDocument = await this.findDocument(activityIdToEdit, documentId);

          document = versionableDocument.getVersion(documentId);
          document.deleted = true;
          await this.updateDocument(activityIdToEdit, document);
        }
      }
    } catch (e) {
      this.logger.error(`Error deleting document file ${_.defaultTo(document.name, filename)} with id ${documentId}. Error: ${e.message}`);
      throw new RestError(500, { message: `Error deleting file for document ${documentId}` });
    }

    return document;
  }

  async deleteDocuments(activityIdToEdit, documentIds) {
    _.forEach(documentIds, (documentId) => {
      if (!validObjectId(documentId)) {
        throw new RestError(400, { message: `Not valid Document id ${documentId}` });
      }
    });
    const cloudStorage = new CloudStorage(this.configuration);
    const filePathFactory = new this.FilePathFactory(
      this.lspId,
      this.configuration,
      this.logger,
    );
    const documentsDeleted = [];
    const documentIdsToDelete = [];

    await Promise.map(documentIds, async (documentId) => {
      const versionableDocument = await this.findDocument(activityIdToEdit, documentId);
      const document = versionableDocument.getVersion(documentId);

      if (_.isNil(document)) {
        throw new RestError(404, { message: 'The document does not exist' });
      }
      const documentPath = filePathFactory.activityFeedbackDocument(documentId, document.name);

      await cloudStorage.deleteFile(documentPath).then(() => {
        documentsDeleted.push(document.toObject());
      }).catch(async (err) => {
        if (!_.isEmpty(_.defaultTo(activityIdToEdit, ''))) {
          const { path: nonRenamedDocumentPath } = await this.buildActivityNonRenamedFilePath(
            activityIdToEdit,
            documentId,
          );

          await cloudStorage.deleteFile(nonRenamedDocumentPath).then(() => {
            documentsDeleted.push(document.toObject());
          }).catch((e) => {
            this.logger.error(`Failed to delete file with id: ${documentId} from Cloud: Err ${e}`);
          });
        } else {
          this.logger.error(`Failed to delete file with id: ${documentId} from Cloud: Err ${err}`);
        }
      });
      const isDocumentSaved = await this.isDocumentSaved(activityIdToEdit, documentId);

      if (isDocumentSaved) {
        documentIdsToDelete.push(document._id);
      }
    });
    try {
      await this.deleteDocumentsFromDB(activityIdToEdit, documentIdsToDelete);
    } catch (e) {
      const documentIdsString = _.join(documentIdsToDelete, ', ');

      this.logger.error(`Error deleting document file ${documentIdsString}. Error: ${e.message}`);
      throw new RestError(500, { message: `Error deleting file for documents ${documentIdsString}` });
    }

    return documentsDeleted;
  }

  async updateDocument(activityId, documentToUpdate) {
    const activityInDb = await this.schema.Activity.findOneWithDeleted({ _id: activityId });
    const activityDocuments = _.get(activityInDb, 'feedbackDetails.documents', []);

    _.set(
      activityInDb,
      'feedbackDetails.documents',
      _.map(
        activityDocuments,
        (doc) => _.map(doc, (docVersion) => (_.toString(docVersion._id) === _.toString(documentToUpdate._id)
          ? Object.assign(docVersion, documentToUpdate) : docVersion)),
      ),
    );
    await this.schema.Activity.updateOne({ _id: activityId }, { $set: { 'feedbackDetails.documents': activityDocuments } });
  }

  async deleteDocumentsFromDB(activityId, documentIds) {
    const activityInDb = await this.schema.Activity.findOneWithDeleted({ _id: activityId });
    const activityDocuments = _.get(activityInDb, 'feedbackDetails.documents', []);

    _.set(
      activityInDb,
      'feedbackDetails.documents',
      _.map(
        activityDocuments,
        (doc) => _.map(doc, (docVersion) => (
          documentIds.map((documentId) => _.toString(documentId))
            .includes(_.toString(docVersion._id))
            ? Object.assign(docVersion, { deleted: true }) : docVersion)),
      ),
    );
    await this.schema.Activity.updateOne({ _id: activityId }, { $set: { 'feedbackDetails.documents': activityDocuments } });
  }

  async findDocument(activityId, documentId) {
    const query = {
      _id: activityId,
    };
    const activityInDb = await this.schema.Activity.findOneWithDeleted(query);

    if (!activityInDb) {
      throw new RestError(404, { message: `The activity ${activityId} does not exist` });
    }
    const activityDocuments = _.get(activityInDb, 'feedbackDetails.documents', []);

    if (!activityDocuments.length) {
      this.logger.info(`User ${activityInDb._id} does not have any documents.`);
      throw new RestError(404, { message: 'No documents available to download' });
    }
    const documents = ActivityVersionableDocument
      .buildFromArray(activityDocuments);
    const versionableDocument = documents.find((f) => f.getVersion(documentId));

    if (!versionableDocument) {
      throw new RestError(404, { message: 'The document does not exist' });
    }

    return versionableDocument;
  }

  async isDocumentSaved(activityId, documentId) {
    const activityInDb = await this.schema.Activity.findOneWithDeleted({ _id: activityId });
    const activityDocuments = _.get(activityInDb, 'feedbackDetails.documents', []);
    let isSaved = false;

    _.forEach(
      activityDocuments,
      (doc) => {
        const documentFound = _.find(doc, (docVersion) => _.toString(docVersion._id) === _.toString(documentId));

        if (!_.isNil(documentFound)) isSaved = true;
      },
    );

    return isSaved;
  }

  async findAttachment(activityId, documentId) {
    const query = {
      _id: activityId,
    };
    const activityInDb = await this.schema.Activity.findOneWithDeleted(query);

    if (!activityInDb) {
      throw new RestError(404, { message: `The activity ${activityId} does not exist` });
    }
    const activityAttachments = _.get(activityInDb, 'emailDetails.embeddedAttachments', []);

    if (!activityAttachments.length) {
      this.logger.info(`User ${activityInDb._id} does not have any attachments.`);
      throw new RestError(404, { message: 'No documents available to download' });
    }
    const attachmentFound = activityAttachments.find(
      (attachment) => _.toString(attachment._id) === documentId,
    );

    if (!attachmentFound) {
      throw new RestError(404, { message: 'The document does not exist' });
    }

    return attachmentFound;
  }

  async buildActivityNonRenamedAttachmentPath(activityId, documentId) {
    const { lspId } = this;
    const fileStorageFacade = new FileStorageFacade(lspId, this.configuration, this.logger);
    const attachment = await this.findAttachment(activityId, documentId);
    const file = fileStorageFacade.nonRenamedActivityEmailDocument(
      activityId,
      attachment,
    );

    return {
      name: attachment.name,
      path: file.path,
    };
  }

  async buildActivityNonRenamedFilePath(activityId, documentId) {
    const { lspId } = this;
    const fileStorageFacade = new VersionableFileStorage(lspId, this.configuration, this.logger);
    const versionableDocument = await this.findDocument(activityId, documentId);
    const document = versionableDocument.getVersion(documentId);
    const extension = fileUtils.getExtension(document.name);
    const file = fileStorageFacade.nonRenamedActivityFeedbackDocument(
      activityId,
      versionableDocument,
      extension,
      documentId,
    );

    return {
      name: document.name,
      path: file.path,
    };
  }

  async buildActivityEmailFilePath(activityId, documentId, documentName) {
    const { lspId } = this;
    const fileStorageFactory = new this.FileStorageFactory(lspId, this.configuration, this.logger);
    let document = {};

    if (validObjectId(activityId)) {
      const activity = await this.schema.Activity.findOneWithDeleted({ _id: activityId });

      document = _.find(
        _.get(activity, 'emailDetails.embeddedAttachments'),
        (attachment) => _.toString(attachment._id) === _.toString(documentId),
      );
    } else {
      document._id = documentId;
      document.name = documentName;
    }
    if (!document) {
      throw new RestError(404, { message: 'The document does not exist' });
    }
    const file = fileStorageFactory.activityEmailDocument(document._id, document.name);

    return {
      name: document.name,
      path: file.path,
    };
  }

  async buildActivityFeedbackDocumentFilePath(activityId, documentId) {
    const { lspId } = this;
    const fileStorageFacade = new VersionableFileStorage(lspId, this.configuration, this.logger);
    const query = {
      _id: activityId,
    };
    const activityInDb = await this.schema.Activity.findOneWithDeleted(query);

    if (!activityInDb) {
      throw new RestError(404, { message: `The activity ${activityId} does not exist` });
    }
    const activityDocuments = _.get(activityInDb, 'feedbackDetails.documents', []);

    if (!activityDocuments.length) {
      this.logger.info(`User ${activityInDb._id} does not have any documents.`);
      throw new RestError(404, { message: 'No documents available to download' });
    }
    const documents = ActivityVersionableDocument
      .buildFromArray(activityDocuments);
    const document = documents.find((f) => f.getVersion(documentId));

    if (!document) {
      throw new RestError(404, { message: 'The document does not exist' });
    }
    const file = fileStorageFacade.activityFeedbackDocument(document, documentId);

    return {
      name: document.name,
      path: file.path,
    };
  }

  _getDocumentsListBasedOnType(activity) {
    let documents = [];

    if (activity.activityType === ACTIVITY_EMAIL_TYPE) {
      documents = _.get(activity, 'emailDetails.embeddedAttachments', []);
    }

    return documents;
  }

  generateActivityFeedbackFilePath(interceptorParams = {}) {
    const fileStorageFacade = new FileStorageFacade(
      this.lspId,
      this.configuration,
      this.logger,
    );
    const { filename } = interceptorParams;
    const documentId = new ObjectId().toString();
    const { path: filePath } = fileStorageFacade.activityFeedbackDocument(documentId, filename);

    return { documentId, filePath };
  }

  generateActivityEmailFilePath(uploadParams) {
    const fileStorageFacade = new FileStorageFacade(
      this.lspId,
      this.configuration,
      this.logger,
    );
    const documentId = new ObjectId().toString();
    const filename = _.get(uploadParams, 'filename', '');
    const { path: filePath } = fileStorageFacade.activityEmailDocument(documentId, filename);

    return { documentId, filePath };
  }

  async renameFeedbackFile(activityId, documentId) {
    const {
      path: oldPath,
      name,
    } = await this.buildActivityNonRenamedFilePath(activityId, documentId);
    const cloudStorage = new CloudStorage(this.configuration);

    return cloudStorage.gcsGetFile(oldPath)
      .then(async (oldCloudFile) => {
        const extension = fileUtils.getExtension(name);
        const newPath = oldCloudFile.name
          .replace(`${_.toString(activityId)}/${_.toString(documentId)}`, _.toString(documentId))
          .replace(`${_.toString(documentId)}${extension}`, name);
        const versionableDocument = await this.findDocument(activityId, documentId);
        const document = versionableDocument.getVersion(documentId);

        await cloudStorage.gcsMoveFile(oldPath, newPath, FEEDBACK_FILE_PREFIX_REGEX);
        document.cloudKey = newPath;
        await this.updateDocument(activityId, document);

        return newPath;
      })
      .catch((err) => {
        this.logger.error(`Failed to find document in GCS: ${err}`);
        throw new RestError(404, { message: `${err}. The file does not exist`, stack: err.stack });
      });
  }

  async renameEmailFile(activityId, documentId) {
    const { path: oldPath, name } = await this.buildActivityNonRenamedAttachmentPath(
      activityId,
      documentId,
    );
    const cloudStorage = new CloudStorage(this.configuration);

    return cloudStorage.gcsGetFile(oldPath)
      .then(async (oldCloudFile) => {
        const extension = fileUtils.getExtension(name);
        const newPath = oldCloudFile.name.replace(_.toString(activityId), _.toString(documentId))
          .replace(`${documentId}${extension}`, name);

        await cloudStorage.gcsMoveFile(oldPath, newPath, EMAIL_FILE_PREFIX_REGEX);
        await this.schema.Activity.updateOne({
          _id: activityId,
          'emailDetails.embeddedAttachments': { $elemMatch: { _id: documentId } },
        }, {
          $set: {
            'emailDetails.embeddedAttachments.$.cloudKey': newPath,
          },
        });

        return newPath;
      })
      .catch((err) => {
        this.logger.error(`Failed to find document in GCS: ${err}`);
        throw new RestError(404, { message: `${err}. The file does not exist`, stack: err.stack });
      });
  }

  async upsertFeedbackDocument(activityId, document) {
    if (!validObjectId(activityId)) return;
    const activity = await this.schema.Activity.findOneWithDeleted({
      _id: new ObjectId(activityId),
    }, {
      'feedbackDetails.documents': 1,
    });
    const documents = _.get(activity, 'feedbackDetails.documents', []);
    const versionableDocuments = ActivityVersionableDocument
      .buildFromArray(documents);
    const documentIndex = _.findIndex(versionableDocuments, (vd) => vd.name === document.name);
    const documentsToUpdate = _.map(versionableDocuments, (vd) => vd.getAllVersions());

    if (documentIndex > -1) {
      documentsToUpdate[documentIndex].push(document);
    } else {
      documentsToUpdate.push([document]);
    }

    return this.schema.Activity.updateOne({
      _id: new ObjectId(activityId),
    }, { $set: { 'feedbackDetails.documents': documentsToUpdate } });
  }

  async handleEmailFileUpload(req, res, interceptorParams, uploadResponse) {
    this.logger.debug(`Interceptor: Successfully uploaded file to gcs: ${_.get(uploadResponse, 'gcsFile.name')}`);
    const newDocument = buildResponseDocument(interceptorParams, uploadResponse, req);

    return sendResponse(res, 200, { newDocument });
  }

  async handleFeedbackFileUpload(req, res, interceptorParams, uploadResponse) {
    this.logger.debug(`Interceptor: Successfully uploaded file to gcs: ${_.get(uploadResponse, 'gcsFile.name')}`);
    const newDocument = buildResponseDocument(interceptorParams, uploadResponse, req);

    await this.upsertFeedbackDocument(interceptorParams.activityId, newDocument);

    return sendResponse(res, 200, { newDocument });
  }

  async handleFileUploadFail(err, res, filename) {
    const message = _.get(err, 'message', err);

    this.logger.error(`Interceptor: Failed to handle file: ${filename}: ${message}`);

    return sendErrorResponse(res, 500, {
      message: `Interceptor: Failed to upload file with name: ${filename}. ${message}`,
      stack: true,
    });
  }

  async ensureDocumentsUploaded(activity) {
    if (activity.activityType === ACTIVITY_FEEDBACK_TYPE) {
      return this._ensureFeedbackDocumentsUploaded(_.get(activity, 'feedbackDetails.documents', []));
    }
    if (activity.activityType === ACTIVITY_EMAIL_TYPE) {
      return this._ensureEmailDocumentsUploaded(_.get(activity, 'emailDetails.embeddedAttachments', []));
    }
  }

  async _ensureFeedbackDocumentsUploaded(documents) {
    const filePathFactory = new FilePathFactory(this.lspId, this.configuration, this.logger);
    const cloudStorage = new CloudStorage(this.configuration);
    const notFoundFiles = [];
    const flattenDocuments = _.flatten(documents);

    await Promise.mapSeries(flattenDocuments, async (document) => {
      const documentPath = await filePathFactory.activityFeedbackDocument(
        _.toString(document._id),
        document.name,
      );

      return cloudStorage.gcsGetFile(documentPath).catch((err) => {
        this.logger.error(`Error saving activity. Feedback file ${document._id} is not found. Error: ${err}`);
        notFoundFiles.push(document.name);
      });
    });
    if (notFoundFiles.length > 0) {
      throw new RestError(400, { message: `Following files not found. ${notFoundFiles.join(', ')}` });
    }
  }

  async _ensureEmailDocumentsUploaded(documents) {
    const fileStorageFacade = new FileStorageFacade(this.lspId, this.configuration, this.logger);
    const cloudStorage = new CloudStorage(this.configuration);
    const notFoundFiles = [];

    await Promise.mapSeries(documents, async (doc) => {
      const { path: documentPath } = await fileStorageFacade.activityEmailDocument(
        doc._id,
        doc.name,
      );

      return cloudStorage.gcsGetFile(documentPath).catch((err) => {
        this.logger.error(`Error saving activity. Email file ${doc._id} is not found. Error: ${err}`);
        notFoundFiles.push(doc.name);
      });
    });
    if (notFoundFiles.length > 0) {
      throw new RestError(400, { message: `Following files not found. ${notFoundFiles.join(', ')}` });
    }
  }
}

module.exports = ActivityDocumentAPI;
