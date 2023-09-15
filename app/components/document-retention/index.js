const mongoose = require('mongoose');

const { ObjectId } = mongoose.Types;
const _ = require('lodash');
const Promise = require('bluebird');
const moment = require('moment');
const MockableMoment = require('../moment');
const CloudStorage = require('../cloud-storage');
const FileStorageFacade = require('../file-storage');
const requestAPIHelper = require('../../endpoints/lsp/request/request-api-helper');
const PcSettingsApi = require('../../endpoints/lsp/portalcat-settings/portalcat-settings-api');
const TranslationMemoryApi = require('../../endpoints/lsp/portalcat/translation-memory/translation-memory-api');

const _findExceedingProviderTaskDocument = (request) => {
  const exceedingTaskDocuments = [];
  const workflows = _.get(request, 'workflows', []);
  const tasks = _.flatten(workflows.map(w => w.tasks));
  tasks.forEach((t) => {
    const providerTasks = _.get(t, 'providerTasks', []);
    const files = _.flatten(providerTasks.map(pt => pt.files));
    const nonDeletedFiles = files.filter(f => _.isNil(f.deletedByRetentionPolicyAt));
    nonDeletedFiles.forEach(f => exceedingTaskDocuments.push({
      task: t,
      file: f,
    }));
  });
  return exceedingTaskDocuments;
};
const EXCEEDING_DOCUMENT_REMOVE_METHOD = {
  requestDocument: {
    method: '_removeRequestDocument',
    fileNamePath: 'name',
  },
  requestTaskDocument: {
    method: '_removeProviderTaskDocument',
    fileNamePath: 'file.name',
  },
};

class DocumentRetentionPolicyApplier {
  constructor(logger, configuration, schema, additionalOptions, lspId, metadata = {}, flags = {}) {
    this.logger = logger;
    this.configuration = configuration;
    this.additionalOptions = additionalOptions;
    this.schema = schema;
    this.FileStorageFacade = FileStorageFacade;
    this.cloudStorage = new CloudStorage(configuration, logger);
    this.lspId = lspId;
    this.processedCompanies = 0;
    this.metadata = metadata;
    this._touch = (cb) => {
      process.nextTick(() => {
        if (cb) {
          cb();
        }
      });
    };
    this.pcSettingsApi = new PcSettingsApi({
      logger, configuration, sessionID: metadata.runId,
    });
    this.translationMemoryApi = new TranslationMemoryApi({
      logger, configuration, sessionID: metadata.runId,
    });
    this.flags = flags;
    this.mockableMoment = new MockableMoment(this.flags.mockServerTime);
  }

  get batchSize() {
    return 50;
  }

  _companyRetentionPolicyThresholdDate(company) {
    const now = this.mockableMoment.getDateObject();
    const { days = 0, hours = 0, minutes = 0 } = company.retention;
    now.add(-days, 'days');
    now.add(-hours, 'hours');
    now.add(-minutes, 'minutes');
    return now;
  }

  _checkAWSValidPrefix(fileStoragePrefixPath) {
    if (!_.isString(fileStoragePrefixPath)) {
      return { valid: false, reason: 'String prefix was expected' };
    }
    if (_.isEmpty(fileStoragePrefixPath)) {
      return { valid: false, reason: 'Empty string provided' };
    }
    const VALID_PREFIXES = /[a-zA-Z0-9]+\/request_files\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+\/.+/;
    if (!fileStoragePrefixPath.match(VALID_PREFIXES)) {
      return { valid: false, reason: 'Prefix does not match expected paths' };
    }
    return { valid: true, reason: '' };
  }
  async _removeRequestDocument(request, document, fileStorageFacade, deleteOnAWS = false) {
    const deletedAtDate = document.deletedByRetentionPolicyAt;
    const finalDocPath = 'finalDocuments.$[document].deletedByRetentionPolicyAt';
    const srcDocPath = 'languageCombinations.$[].documents.$[document].deletedByRetentionPolicyAt';
    const key = document.final ? finalDocPath : srcDocPath;
    const update = { $set: { [key]: deletedAtDate } };
    const options = { multi: false, arrayFilters: [{ 'document._id': document._id }] };
    await this.schema.Request.findOneAndUpdate({ _id: request._id }, update, options).exec();
    const companyId = _.get(request, 'company._id').toString();
    const requestId = request._id.toString();
    let fileStorage;
    if (document.final) {
      this.logger.debug(`Will delete final src document ${document.name}`, this.metadata);
      fileStorage = fileStorageFacade
        .translationRequestFinalFile(companyId, requestId, document, deleteOnAWS);
    } else {
      this.logger.debug(`Will delete src document ${document.name}`, this.metadata);
      fileStorage = fileStorageFacade
        .translationRequestFile(companyId, requestId, document, deleteOnAWS);
    }
    const path = fileStorage.path;
    if (deleteOnAWS) {
      this.logger.debug(`Deleting on AWS bucket, req doc file ${path}`, this.metadata);
      const prefixValidation = this._checkAWSValidPrefix(path);
      if (_.isBoolean(prefixValidation.valid) && prefixValidation.valid) {
        const res = await this.cloudStorage.wipeOutBucketFiles(path);
        const removedAWSObjects = res.Deleted || [];
        this.logger.debug(`AWS Version Deletion <${path}> Removed: ${removedAWSObjects}`,
          this.metadata);
        return res;
      }
      this.logger.debug(`Invalid document prefix provided <${path}> ${prefixValidation.reason}`,
        this.metadata);
      return Promise.resolve();
    }
    this.logger.debug(`Deleting file ${path} for requestId: ${requestId}, companyId: ${companyId} and lspId: ${this.lspId}`,
      this.metadata);
    return fileStorage.delete();
  }
  async _removeProviderTaskDocument(request, document, fileStorageFacade, deleteOnAWS = false) {
    const deletedAtDate = document.deletedByRetentionPolicyAt;
    const update = {
      $set: {
        'workflows.$[].tasks.$[].providerTasks.$[].files.$[file].deletedByRetentionPolicyAt': deletedAtDate,
      },
    };
    const options = {
      multi: false,
      arrayFilters: [
        { 'file._id': document.file._id },
      ],
    };
    await this.schema.Request.findOneAndUpdate({ _id: request._id }, update, options).exec();
    const companyId = _.get(request, 'company._id').toString();
    const requestId = request._id.toString();
    const taskId = document.task._id.toString();
    const taskDocument = document.file;
    this.logger.debug(`Will task document ${taskDocument.name}`, this.metadata);
    const fileStorage = fileStorageFacade
      .translationRequestTaskFile(companyId, requestId, taskId, taskDocument, deleteOnAWS);
    taskDocument.deletedByRetentionPolicyAt = new Date();
    const path = fileStorage.path;
    this.logger.debug(`Deleting file ${path}`, this.metadata);
    if (deleteOnAWS) {
      this.logger.debug(`Deleting on AWS bucket, task doc file ${path}`, this.metadata);
      const prefixValidation = this._checkAWSValidPrefix(path);
      if (_.isBoolean(prefixValidation.valid) && prefixValidation.valid) {
        const res = await this.cloudStorage.wipeOutBucketFiles(path);
        const removedAWSObjects = res.Deleted || [];
        this.logger.debug(`AWS Version Deletion <${path}> Removed: ${removedAWSObjects}`,
          this.metadata);
        return res;
      }
      this.logger.debug(`Invalid document prefix provided <${path}> ${prefixValidation.reason}`,
        this.metadata);
      return Promise.resolve();
    }
    this.logger.debug(`Deleting file ${path} for requestId: ${requestId}, companyId: ${companyId} and lspId: ${this.lspId}`,
      this.metadata);
    return fileStorage.delete();
  }
  async _processRequest(request) {
    this.logger.debug(`Procesing request with _id: ${request._id} and title: ${request.title}`,
      this.metadata);
    const fileStorageFacade =
      new this.FileStorageFacade(request.lspId, this.configuration, this.logger);
    const sourceDocuments = requestAPIHelper.getRequestDocuments(request.languageCombinations);
    const documentsToRemove = _.concat(sourceDocuments, request.finalDocuments)
      .filter(d => d.deletedByRetentionPolicyAt === null);
    const taskDocumentsToRemove = _findExceedingProviderTaskDocument(request);
    if (_.isEmpty(documentsToRemove) && _.isEmpty(taskDocumentsToRemove)) return;
    this.logger.debug(`Pausing cursor on documents removal for request: ${request._id}`,
      this.metadata);
    const requestDocumentsToRemove = documentsToRemove.map(d => ({
      t: 'requestDocument',
      document: d,
    }));
    const requestTaskDocumentsToRemove = taskDocumentsToRemove.map(d => ({
      t: 'requestTaskDocument',
      document: d,
    }));
    const allDocumentsToRemove = _.concat(requestDocumentsToRemove, requestTaskDocumentsToRemove);
    try {
      await Promise.mapSeries(allDocumentsToRemove, async (exceedingDocument) => {
        exceedingDocument.document.deletedByRetentionPolicyAt = moment.utc().toDate();
        const removeOps = [];
        const { method, fileNamePath } = EXCEEDING_DOCUMENT_REMOVE_METHOD[exceedingDocument.t];
        if (_.isNil(method)) {
          this.logger.info(`Unknown exceeding document ${exceedingDocument.t}`, this.metadata);
        } else {
          const document = exceedingDocument.document;
          const promise = this[method](request, document, fileStorageFacade);
          const promiseAWS = this[method](request, document, fileStorageFacade, true);
          removeOps.push(promise, promiseAWS);
          const fileName = _.get(document, fileNamePath);
          this.logger.info(`Starting deletion process for document: ${fileName}`,
            this.metadata);
        }
        return Promise.all(removeOps);
      });
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error removing documents due retention policy for request ${request._id}. Error: ${message}`,
        this.metadata);
    }
    const bucketPrefixes = _.get(request, 'bucketPrefixes', []);
    if (_.isEmpty(bucketPrefixes)) return;
    const prefixesStr = bucketPrefixes.join(', ');
    this.logger.info(`AWS Bucket Full Version Removal Based on Prefixes: ${prefixesStr}`,
      this.metadata);
    try {
      const prefixRegex = /[a-zA-Z0-9]{24}\/request_files\/[a-zA-Z0-9]{24}\/[a-zA-Z0-9]{24}\//;
      await Promise.map(bucketPrefixes, async (prefix) => {
        if (!_.isString(prefix) || !prefix.match(prefixRegex)) {
          this.logger.debug(`AWS Bucket Full Version Removal: Invalid document prefix provided <${prefix}>`,
            this.metadata);
          return Promise.resolve();
        }
        const res = await this.cloudStorage.wipeOutBucketFiles(prefix);
        const removedAWSObjects = _.get(res, 'Deleted', []);
        this.logger.debug(`AWS Bucket Full Version Removal: Success <${prefix}> Removed: ${JSON.stringify(removedAWSObjects)}`,
          this.metadata);
        return res;
      });
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`AWS Bucket Full Version Removal Error removing documents due retention policy for request ${request._id}. Error: ${message} Prefixes: ${prefixesStr}`,
        this.metadata);
    }
  }

  async _removeCompanyTm(company, thresholdDate) {
    const { descriptors } =
      await this.pcSettingsApi.list({ lspId: this.lspId, type: 'tm', companyId: company._id });
    return Promise.map(
      descriptors,
      descriptor => this.translationMemoryApi.deleteTm({
        lspId: this.lspId,
        companyId: company._id,
        tmId: descriptor._id,
        retentionStartDate: thresholdDate.format(),
      })
        .catch(err => this.logger.error(`Error deleting company translation memory: ${err}`)),
    );
  }

  async _removeExceedingCompanyDocuments(company, thresholdDate) {
    const { batchSize } = this;
    const cursor = this.schema.Request.find({
      lspId: this.lspId,
      'company._id': company._id,
      $or: [{
        completedAt: { $lt: thresholdDate },
      }, {
        cancelledAt: { $lt: thresholdDate },
      }],
    }).cursor({ batchSize });
    await cursor.eachAsync(request => this._processRequest(request, thresholdDate));
    await this._removeCompanyTm(company, thresholdDate);
  }

  async findExceedingRetentionDocument(job) {
    this.logger.debug(`Executing findExceedingRetentionDocument from lsp: ${this.lspId}`,
      this.metadata);
    const companyQuery = {
      lspId: this.lspId,
    };
    const companyId = _.get(job, 'attrs.data.params.entityId', null);
    if (!_.isNil(companyId)) {
      Object.assign(companyQuery, { _id: new ObjectId(companyId) });
    } else {
      Object.assign(companyQuery, {
        $or: [
          { 'retention.days': { $ne: 0 } },
          { 'retention.hours': { $ne: 0 } },
          { 'retention.minutes': { $ne: 0 } },
        ],
      });
    }
    const companies = await this.schema.CompanySecondary.find(
      companyQuery,
      { retention: 1, name: 1 }).lean().exec();
    const len = companies.length;
    this.logger.debug(`Will process ${len} companies from lsp: ${this.lspId}`,
      this.metadata);
    try {
      await Promise.map(companies, async (c) => {
        const thresholdDate = this._companyRetentionPolicyThresholdDate(c);
        this.logger.debug(`Searching for exceeding documents in company ${c.name} Date: ${thresholdDate}`,
          this.metadata);
        await this._removeExceedingCompanyDocuments(c, thresholdDate);
        this.processedCompanies++;
        this.logger.debug(`Processed ${this.processedCompanies} / ${len} companies from lsp: ${this.lspId}`,
          this.metadata);
        return new Promise((resolve) => {
          this._touch(resolve);
        });
      });
    } catch (err) {
      const message = err.message || err;
      this.logger.error(`Error executing findExceedingRetentionDocument from lsp: ${this.lspId}. Error ${message}`,
        this.metadata);
      throw err;
    }
    this.logger.debug(`Done executing findExceedingRetentionDocument from lsp: ${this.lspId}`,
      this.metadata);
  }

  run(job) {
    return this.findExceedingRetentionDocument(job);
  }
}

module.exports = DocumentRetentionPolicyApplier;
