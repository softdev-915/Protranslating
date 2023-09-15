const _ = require('lodash');
const FilePathFactory = require('./file-path-factory');
const FileStorage = require('./file-storage');

class FileStorageFacade {
  constructor(lspId, configuration, logger) {
    this.filePathFactory = new FilePathFactory(lspId, configuration, logger);
    this.FileStorage = FileStorage;
    this.logger = logger;
    this.lspId = lspId;
  }

  sysTempFile(name, extraTmpPath) {
    const tempFilePath = this.filePathFactory.sysTempFile(`${extraTmpPath}/${name}`);
    return new this.FileStorage(tempFilePath, this.logger);
  }
  /**
   * tempFile returns a FileStorage of a temporary file the given name.
   * @param {String} name the temporary file name.
   * @return {Object} FileStorage object.
   */
  tempFile(name) {
    const tempFilePath = this.filePathFactory.tempFile(name);
    return new this.FileStorage(tempFilePath, this.logger);
  }

  /**
   * the request files folders
   * @param {String} companyId the company's id
   * @param {String} requestId the request's id
   */
  requestFilesFolder(companyId, requestId) {
    const tempFilePath = this.filePathFactory.requestFilesFolder(companyId, requestId);
    return new this.FileStorage(tempFilePath, this.logger);
  }

  /**
   * translationRequestFile returns a File Storage of a translation request file.
   * @param {String} companyId the company id.
   * @param {String} requestId the request id.
   * @param {Object} document the document id.
   * @param {String} extension the file extension.
   * @return {Object} FileStorage object.
   */
  translationRequestFile(companyId, requestId, document) {
    const requestFilePath = this.filePathFactory.translationRequestFile(companyId,
      requestId, document);
    return new this.FileStorage(requestFilePath, this.logger);
  }

  /**
   * pipelineActionFile returns a File Storage of a pipeline action file.
   * @param {Object} inputData company, request, workflow, pipeline, action, task and file.
   * @param {Boolean} bucketKey the aws bucket key corresponding to thedifle.
   * @return {Object} FileStorage object.
   */
  pipelineActionFile(inputData, bucketKey = false) {
    const actionFilePath = this.filePathFactory.pipelineActionFile(inputData, bucketKey);
    return new this.FileStorage(actionFilePath, this.logger);
  }

  /**
   * opportunityFile returns a File Storage of a opportunity file.
   * @param {String} companyId the company id.
   * @param {String} opportunityId the opportunity id.
   * @param {Object} document the document id.
   * @param {String} extension the file extension.
   * @return {Object} FileStorage object.
   */
  opportunityFile(companyId, opportunityId, document) {
    const opportunityFilePath = this.filePathFactory.opportunityFile(companyId,
      opportunityId, document);
    return new this.FileStorage(opportunityFilePath, this.logger);
  }

  /**
   * activityEmailDocument returns a FileStorage of a activity email attachment
   * @param {String | Object} documentId the document ID
   * @param {String} documentName the document name
   * @return {Object} FileStorage object
   */
  activityEmailDocument(documentId, documentName) {
    const activityEmailFilePath = this.filePathFactory
      .activityEmailDocument(documentId, documentName);
    return new this.FileStorage(activityEmailFilePath, this.logger);
  }
  /**
   * nonRenamedActivityEmailDocument returns a FileStorage of a activity email attachment
   * @param {String | Object} activityId the activity ID
   * @param {String | Object} document the document ID
   * @return {Object} FileStorage object
   */
  nonRenamedActivityEmailDocument(activityId, document) {
    const activityEmailFilePath = this.filePathFactory
      .nonRenamedActivityAttachmentFile(activityId, document);
    return new this.FileStorage(activityEmailFilePath, this.logger);
  }

  /**
   * activityFeedbackDocument returns a FileStorage of a activity feedback document
   * @param {String | Object} documentId the document object
   * @param {String} documentName the document name
   * @return {Object} FileStorage object
   */
  activityFeedbackDocument(documentId, documentName) {
    const attachmentFilePath = this.filePathFactory
      .activityFeedbackDocument(documentId, documentName);
    return new this.FileStorage(attachmentFilePath, this.logger);
  }

  /**
   * bill file returns a FileStorage of a bill document
   * @param {String} billId the bill id
   * @param {*} document the document object
   * @return {Object} FileStorage object
   */
  billFile(billId, document) {
    const billFilePath = this.filePathFactory
      .getBillFilesPath(billId, document);
    return new this.FileStorage(billFilePath, this.logger);
  }

  /**
   * bill adjustment file returns a FileStorage of a bill adjustment document
   * @param {String} billAdjustmentId the bill adjustment id
   * @param {*} document the document object
   * @return {Object} FileStorage object
   */
  billAdjustmentFile(billAdjustmentId, document) {
    const billAdjustmentFilePath = this.filePathFactory
      .getBillAdjustmentFilesPath(billAdjustmentId, document);
    return new this.FileStorage(billAdjustmentFilePath, this.logger);
  }

  /**
   * translationRequestFinalFile returns a File Storage of a translation request final file.
   * @param {String} companyId the company id.
   * @param {String} requestId the request id.
   * @param {Object} document the document id.
   * @param {String} extension the file extension.
   * @return {Object} FileStorage object.
   */
  translationRequestFinalFile(companyId, requestId, document) {
    const requestFilePath = this.filePathFactory.translationRequestFinalFile(companyId,
      requestId, document);
    return new this.FileStorage(requestFilePath, this.logger);
  }

  requestFilePath(companyId, requestId, document) {
    const documentName = _.get(document, 'name', document);
    if (_.get(document, 'final', false)) {
      return this.translationRequestFinalFile(companyId, requestId, documentName);
    }
    return this.translationRequestFile(companyId, requestId, documentName);
  }

  /**
   * translationRequestTaskFile returns the path string for a request task file.
   * @param {String | Object} company the company id or object.
   * @param {String | Object} request the request id or object.
   * @param {String | Object} task the task id or object.
   * @param {String | Object} document the document id or object.
   * @return {Object} FileStorage object.
   */
  translationRequestTaskFile(company, request, task, document) {
    const requestTaskFilePath = this.filePathFactory.translationRequestTaskFile(company,
      request, task, document);
    return new this.FileStorage(requestTaskFilePath, this.logger);
  }

  /**
   * documentProspectFile returns a File Storage of a prospect document file.
   * @param {String | Object} document the document id or object.
   * @param {String} extension the file extension.
   * @return {Object} FileStorage object.
   */
  documentProspectFile(document, extension) {
    const documentProspectPath = this.filePathFactory.documentProspectFile(document,
      extension);
    return new this.FileStorage(documentProspectPath, this.logger);
  }

  userHiringDocumentProspect(userId, document, extension) {
    const userHiringDocumentPath = this.filePathFactory
      .userHiringDocumentProspect(userId, document, extension);
    return new this.FileStorage(userHiringDocumentPath, this.logger);
  }

  /**
   * entityDocumentProspect returns a File Storage of a entity document file.
   * @param {String} entityId the entity id.
   * @param {String} extension the file extension.
   * @return {Object} FileStorage object.
   */
  entityDocumentProspect(entityId, documentFolder, document, extension) {
    const entityDocumentPath = this.filePathFactory
      .entityDocumentProspect(entityId, documentFolder, document, extension);
    return new this.FileStorage(entityDocumentPath, this.logger);
  }
}

module.exports = FileStorageFacade;
