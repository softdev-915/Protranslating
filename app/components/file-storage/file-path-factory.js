
const mongoose = require('mongoose');
const path = require('path');
const fileUtils = require('../../utils/file');

const folders = {
  prospectDocuments: 'prospect_documents',
  requestFiles: 'request_files',
  opportunityFiles: 'opportunity_files',
  source: 'source_files',
  final: 'final_files',
  task: 'task_files',
  tempDirectory: 'temp',
  ocrFilesFolder: 'ocr_temp_files',
  finalFolder: 'final',
  finalFilesFolder: 'final_files',
  taskFolder: 'task',
  taskFilesFolder: 'task_files',
  userHiringDocumentFolder: 'user_hiring_files',
  activityFiles: 'activity_files',
  billFilesFolder: 'bill_files',
  billAdjustmentFilesFolder: 'bill_adjustment_files',
  arInvoiceFiles: 'ar_invoice_files',
  arAdjustmentFiles: 'ar_adjustment_files',
  arAdvanceFiles: 'ar_advances_files',
  arPaymentFiles: 'ar_payment_files',
  apPaymentFiles: 'ap_payment_files',
  pcFiles: 'portalcat_files',
  pcPipelineActionsFiles: 'downloads/xliff',
};

const extractId = (e) => {
  if (typeof e === 'string') {
    return e;
  }
  if (e instanceof mongoose.Types.ObjectId) {
    return e.toString();
  }

  return e._id.toString();
};

const extractExtension = (document, extension) => {
  if (typeof document === 'string') {
    return extension;
  }
  let ext = fileUtils.getExtension(document.name);

  if (ext.length) {
    ext = `${ext}`;
  }

  return ext;
};

class FilePathFactory {
  constructor(lspId, configuration, logger) {
    if (lspId) {
      this.lspId = lspId.toString();
    }
    this.logger = logger;
    const environmentConfig = configuration.environment;

    this.filesPath = environmentConfig.LMS_FILES_PATH;
    this.systemTmpPath = '/tmp';
    this.folders = folders;
  }

  sysTempFile(name) {
    return path.join(this.systemTmpPath, name);
  }

  tempFile(name) {
    const tempFolder = folders.tempDirectory;

    return path.join(
      this.filesPath,
      this.lspId,
      tempFolder,
      name,
    );
  }

  requestFilesFolder(companyId, requestId) {
    const requestFilesFolder = folders.requestFiles;

    return path.join(
      this.filesPath,
      this.lspId,
      requestFilesFolder,
      companyId,
      requestId,
    );
  }

  /**
   * documentFileName generates a document file name
   * @param {String | Object} document the document id or object.
   * @param {String} extension the file extension.
   * @return {String} the file name
   */
  documentFileName(document, extension) {
    if (typeof document !== 'string' || extension) {
      const ext = extractExtension(document, extension);
      const documentId = extractId(document);

      return `${documentId}${ext}`;
    }

    return document;
  }

  /**
   * translationRequestFile returns the path string to the file.
   * @param {String | Object} company the company id or object.
   * @param {String | Object} request the request id or object.
   * @param {String | Object} document the document id or object.
   * @return {String} the file path or bucket key
   */
  translationRequestFile(company, request, document) {
    const companyId = extractId(company);
    const requestId = extractId(request);
    const fileName = this.documentFileName(document);
    const requestFilesFolder = folders.requestFiles;

    return path.join(this.lspId, requestFilesFolder, companyId, requestId, fileName);
  }

  /**
   * pipelineActionFile returns the path string to the file.
   * @param {Object} inputData company, request, workflow, pipeline, action, task and file.
   * @param {Boolean} bucketKey the aws bucket key corresponding to thedifle.
   * @return {String} the file path or bucket key
   */
  pipelineActionFile({
    company, request, pipeline, action, file,
  }, bucketKey = false) {
    const filePrefix = (!bucketKey) ? this.filesPath : '';
    const companyId = extractId(company);
    const requestId = extractId(request);
    const pipelineId = extractId(pipeline);
    const actionId = extractId(action);
    const fileId = extractId(file.fileId);
    return path.join(filePrefix, this.lspId, folders.pcFiles,
      companyId, requestId, folders.pcPipelineActionsFiles,
      pipelineId, actionId, fileId, file.fileName);
  }

  /**
   * translationRequestFinalFile returns the path string for a request final file.
   * @param {String | Object} company the company id or object.
   * @param {String | Object} request the request id or object.
   * @param {String | Object} document the document id or object.
   * @return {String} the file path or bucket key
   */
  translationRequestFinalFile(company, request, document) {
    const companyId = extractId(company);
    const requestId = extractId(request);
    const fileName = this.documentFileName(document);
    const requestFilesFolder = folders.requestFiles;

    return path.join(
      this.lspId,
      requestFilesFolder,

      companyId,

      requestId,

      folders.finalFolder,
      folders.finalFilesFolder,

      fileName,
    );
  }

  /**
   * translationRequestTaskFile returns the path string for a request task file.
   * @param {String | Object} company the company id or object.
   * @param {String | Object} request the request id or object.
   * @param {String | Object} task the task id or object.
   * @param {String | Object} document the document id or object.
   * @return {String} the file path or bucket key
   */
  translationRequestTaskFile(company, request, task, document) {
    const companyId = extractId(company);
    const requestId = extractId(request);
    const taskId = extractId(task);
    const fileName = this.documentFileName(document);
    const requestFilesFolder = folders.requestFiles;

    return path.join(
      this.lspId,
      requestFilesFolder,
      companyId,
      requestId,
      folders.taskFolder,
      taskId,
      folders.taskFilesFolder,
      fileName,
    );
  }

  /**
   * translationOCRFolder returns the path string to the folder with OCR result for the file.
   * @param {String | Object} company the company id or object.
   * @param {String | Object} request the request id or object.
   * @param {String | Object} document the document id or object.
   * @return {String} the file path or bucket key
   */
  translationOCRFolder(company, request, document) {
    const companyId = extractId(company);
    const requestId = extractId(request);
    const fileName = this.documentFileName(document);
    const requestFilesFolder = folders.requestFiles;
    const ocrFilesFolder = folders.ocrFilesFolder;
    return path.join(
      this.lspId,
      requestFilesFolder,
      companyId,
      requestId,
      ocrFilesFolder,
      fileName,
    );
  }
  /**
   * opportunityFile returns the path string to the file.
   * @param {String | Object} company the company id or object.
   * @param {String | Object} opportunity the opportunity id or object.
   * @param {String | Object} document the document id or object.
   * @return {String} the file path or bucket key
   */
  opportunityFile(company, opportunity, document) {
    const companyId = extractId(company);
    const opportunityId = extractId(opportunity);
    const fileName = this.documentFileName(document);
    const opportunityFilesFolder = folders.opportunityFiles;

    return path.join(this.lspId, opportunityFilesFolder, companyId, opportunityId, fileName);
  }

  /**
   * getBillFilePath returns the path string to the file.
   * @param {String | Object} bill the bill id or object.
   * @param {String | Object} document the document id or object.
   * @return {String} the file path or bucket key
   */
  getBillFilesPath(bill, document) {
    const billId = extractId(bill);
    const fileName = this.documentFileName(document);
    const { billFilesFolder } = folders;

    return path.join(this.lspId, billFilesFolder, billId, fileName);
  }

  /**
   * getBillAdjustmentFilePath returns the path string to the file.
   * @param {String | Object} billAdjustment the bill adjustment id or object.
   * @param {String | Object} document the document id or object.
   * @return {String} the file path or bucket key
   */
  getBillAdjustmentFilesPath(billAdjustment, document) {
    const billAdjustmentId = extractId(billAdjustment);
    const fileName = this.documentFileName(document);
    const { billAdjustmentFilesFolder } = folders;

    return path.join(this.lspId, billAdjustmentFilesFolder, billAdjustmentId, fileName);
  }

  /**
   * documentProspectFile returns the path string to the file.
   * @param {String | Object} document the document id or object.
   * @param {String} extension the file extension.
   * @return {String} the file path
   */
  documentProspectFile(document, extension) {
    const fileName = this.documentFileName(document, extension);
    const prospectFolder = this.folders.prospectDocuments;

    return path.join(this.lspId, prospectFolder, fileName);
  }

  /**
   * returns a file path for a single user document.
   * @param {String | Object} userId the user id or object.
   * @param {String | Object} document the document id or object.
   * @return {String} the file path
   */
  userHiringDocumentProspect(userId, document, extension) {
    const fileName = this.documentFileName(document, extension);
    const userProspectFolder = this.folders.userHiringDocumentFolder;

    return path.join(this.lspId, userProspectFolder, userId, fileName);
  }

  /**
   * returns a file path for a single user document.
   * @param {String | Object} userId the request id or object.
   * @param {String | Object} document the document id or object.
   * @return {String} the file path
   */
  userHiringDocument(userId, document, extension, version) {
    const fileName = this.documentFileName(document, extension);
    const userProspectFolder = this.folders.userHiringDocumentFolder;

    return path.join(this.lspId, userProspectFolder, userId, version.toString(), fileName);
  }

  /**
   * returns a file path for a single document.
   * @param {String | Object} entityId the entity id or object.
   * @param {String | Object} document the document id or object.
   * @return {String} the file path
  */
  entityDocumentProspect(entityId, entityFolder, document, extension) {
    const tempEntityId = entityId || 'undefined';
    const fileName = this.documentFileName(document, extension);
    const entityProspectFolder = this.folders[entityFolder];

    return path.join(this.lspId, entityProspectFolder, tempEntityId, fileName);
  }

  /**
   * returns a file path for a single activity document.
   * @param {String | Object} document the document id or object.
   * @param {String} extension of the document.
   * @return {String} the file path
   */
  activityDocument(document, extension) {
    const fileName = this.documentFileName(document, extension);
    const activityProspectFolder = this.folders.activityFiles;

    return path.join(this.lspId, activityProspectFolder, fileName);
  }

  /**
   * returns a file path for a single non renamed feedback activity document.
   * @param {String | ObjectId} activityId the activity id.
   * @param {String | Object} document the document id or object.
   * @param {String} extension of the document.
   * @param {String | ObjectId} version of the document.
   * @return {String} the file path
   */
  nonRenamedActivityFeedbackDocument(activityId, document, extension, version = '') {
    const fileName = this.documentFileName(document, extension);
    const activityFolder = this.folders.activityFiles;

    return path.join(
      this.lspId,
      activityFolder,
      activityId,
      version.toString(),
      fileName,
    );
  }

  /**
   * returns a file path for a single non renamed email activity document.
   * @param {String | ObjectId | Object} activity the activity.
   * @param {String | Object} document the document id or object.
   * @return {String} the file path
   */
  nonRenamedActivityAttachmentFile(activity, document) {
    const activityId = extractId(activity);
    const fileName = this.documentFileName(document);
    const activityFilesFolder = folders.activityFiles;

    return path.join(this.lspId, activityFilesFolder, activityId, fileName);
  }

  /**
   * returns a file path for a single activity document.
   * @param {String | Object} document the document id or object.
   * @param {String} documentName the document name.
   * @return {String} the file path
   */
  activityEmailDocument(document, documentName) {
    const documentId = extractId(document);
    const activityFolder = this.folders.activityFiles;

    return path.join(this.lspId, activityFolder, documentId, documentName);
  }

  /**
   * returns a file path for a single activity document.
   * @param {String | Object} document the document id or object.
   * @param {String} documentName the document name.
   * @return {String} the file path
   */
  activityFeedbackDocument(document, documentName) {
    const documentId = extractId(document);
    const activityFolder = this.folders.activityFiles;

    return path.join(this.lspId, activityFolder, documentId, documentName);
  }

  lspSrxFile(document, language, bucketKey = false) {
    const filePrefix = (!bucketKey) ? this.filesPath : '';
    const fileName = `${language.name.toLowerCase()}__${this.documentFileName(document)}`;
    const srxFilesFolder = folders.srxFiles;

    return path.join(filePrefix, this.lspId, srxFilesFolder, fileName);
  }

  companySrxFile(document, companyId, language, bucketKey = false) {
    const filePrefix = (!bucketKey) ? this.filesPath : '';
    const fileName = `${language.name.toLowerCase()}__${this.documentFileName(document)}`;
    const srxFilesFolder = folders.srxFiles;

    return path.join(filePrefix, this.lspId, srxFilesFolder, 'companies', companyId, fileName);
  }

  companyTbFile(document, companyId, languages, bucketKey = false) {
    const filePrefix = (!bucketKey) ? this.filesPath : '';
    const fileName = `${languages.toLowerCase()}__${this.documentFileName(document)}`;
    const tbFilesFolder = folders.tbFiles;

    return path.join(filePrefix, this.lspId, tbFilesFolder, 'companies', companyId, fileName);
  }

  companyTmFile(document, companyId, languages, bucketKey = false) {
    const filePrefix = (!bucketKey) ? this.filesPath : '';
    const fileName = `${languages.toLowerCase()}__${this.documentFileName(document)}`;
    const tmFilesFolder = folders.tmFiles;

    return path.join(filePrefix, this.lspId, tmFilesFolder, 'companies', companyId, fileName);
  }

  eopPublicKey() {
    return this._eopPublicKey;
  }

  eopPrivateKey() {
    return this._eopPrivateKey;
  }

  eopCompletedFile(id) {
    return path.join(this.eopPath, `${id}.csv`);
  }

  eopFolder(id) {
    return path.join(this.eopPath, id);
  }

  eopTempFolder(id) {
    const basedir = path.join('/', 'tmp', 'eop');
    if (id) {
      return path.join(basedir, id);
    }
    return basedir;
  }

  eopTempCSV(name) {
    const fileName = `EOP_${name}.csv`;
    const dir = this.eopTempFolder();
    return path.join(dir, fileName);
  }

  eopRequestPageFolder(id, page) {
    const eopFolderPath = this.eopTempFolder(id);
    return path.join(eopFolderPath, page);
  }

  eopOffer(id, page, lang) {
    const eopPageFolder = this.eopRequestPageFolder(id, page);
    return path.join(eopPageFolder, `offers-${lang}.xml`);
  }

  eopOfferDetail(id, page, offerId) {
    const eopPageFolder = this.eopRequestPageFolder(id, page);
    return path.join(eopPageFolder, `offer-${offerId}-details.xml`);
  }

  eopRedemptionCode(id, page, offerId) {
    const eopPageFolder = this.eopRequestPageFolder(id, page);
    return path.join(eopPageFolder, `offer-${offerId}-redemption.xml`);
  }
  // getInvoiceFilePath(invoiceId, fileName) {
  //   const invoiceFilesFolder = folders.invoiceFiles;
  //   return path.join(this.lspId, invoiceFilesFolder, invoiceId, fileName);
  // }

  // getAdjustmentFilePath(adjustmentId, fileName) {
  //   const adjustmentFolder = folders.adjustmentFiles;
  //   return path.join(this.lspId, adjustmentFolder, adjustmentId, fileName);
  // }

  // advanceFile(advanceId, document) {
  //   const filename = this.documentFileName(document);
  //   return path.join(this.lspId, folders.advancesFiles, advanceId, filename);
  // }

  getFilePath(folderName, entityId, document) {
    const filename = this.documentFileName(document);

    return path.join(this.lspId, folders[folderName], entityId, filename);
  }
}

module.exports = FilePathFactory;
