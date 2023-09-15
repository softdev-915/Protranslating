const _ = require('lodash');
const Promise = require('bluebird');
const PdfMake = require('pdfmake');
const { Types: { ObjectId } } = require('mongoose');
const logger = require('../log/logger');
const FilePathFactory = require('../file-storage/file-path-factory');
const GoogleVisionService = require('./google-vision-service');
const GoogleVisionMockService = require('./google-vision-mock-service');
const GoogleTranslationService = require('./google-translation-service');
const GoogleTranslationMockService = require('./google-translation-mock-service');
const configuration = require('../configuration');
const CloudStorage = require('../cloud-storage');
const WorkflowUpdater = require('../../endpoints/lsp/request/workflow-updater');
const WorkflowTaskUpdater = require('../../endpoints/lsp/request/workflow-task-updater');
const FileStorageFacade = require('../file-storage');
const requestAPIHelper = require('../../endpoints/lsp/request/request-api-helper');
const fileUtils = require('../../utils/file');
const { streamToPromise } = require('../cloud-storage/cloud-storage-helpers');
const { chooseProperBucket } = require('../aws/mock-bucket');
const RequestTaskApi = require('../../endpoints/lsp/request/task/request-task-api');
const { sum } = require('../../utils/bigjs');

const sampleUser = { roles: ['WORKFLOW_UPDATE_ALL', 'WORKFLOW_CREATE_ALL'] };
const mockFileNames = ['LSP-271_E2E_TEST_PDF_1.pdf', 'LSP-271_E2E_TEST_PDF_2.pdf', 'LSP-271_E2E_TEST_PDF_ERROR.pdf'];
const AUTO_SCAN_ABILITY_SKIPPED = 'Auto Scan PDF to MT Skipped';
const AUTO_SCAN_ABILITY_TRANSLATED = 'Auto Scan PDF to MT Translated';
const rateFilterFactory = (abilityToFind, languageCombinationToFind) => ({ sourceLanguage, targetLanguage, ability = '' }) => {
  const srcLangIsoCode = _.get(sourceLanguage, 'isoCode', '').toString();
  const tgtLangIsoCode = _.get(targetLanguage, 'isoCode', '').toString();
  const tgtLangCombinationIsoCode = _.get(languageCombinationToFind, 'tgtLangs[0].isoCode', '').toString();
  const srcLangCombinationIsoCode = _.get(languageCombinationToFind, 'srcLangs[0].isoCode', '').toString();
  return srcLangIsoCode === srcLangCombinationIsoCode
    && tgtLangIsoCode === tgtLangCombinationIsoCode
    && ability === abilityToFind;
};
const PDF_DOC_DEFINITION = {
  content: [],
  defaultStyle: {
    font: 'Helvetica',
  },
};
const PDF_FONTS_DESCRIPTOR = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};
const NA_NAME = 'NA';

class TranslationRunner {
  constructor(schema, lsp, flags) {
    this.schema = schema;
    this.lsp = lsp;
    this.flags = flags;
    this.logger = logger;
    this.visionService = _.get(this, 'flags.mock', false) ? new GoogleVisionMockService() : new GoogleVisionService(this.logger);
    this.translationService = _.get(this, 'flags.mock', false) ? new GoogleTranslationMockService() : new GoogleTranslationService(this.logger);
    this.filePathFactory = new FilePathFactory(this.lsp._id, configuration);
    this.fileStorageFacade = new FileStorageFacade(this.lsp._id, configuration, this.logger);
    this.cloudStorage = new CloudStorage(configuration);
  }

  async getNAEntities() {
    const internalDepartmentPromise = this.schema.InternalDepartment.findOneWithDeleted({
      name: NA_NAME,
      lspId: this.lsp._id,
    });
    const competenceLevelPromise = this.schema.CompetenceLevel.findOneWithDeleted({
      name: NA_NAME,
      lspId: this.lsp._id,
    });
    const [internalDepartment, competenceLevel] = await Promise.all(
      [internalDepartmentPromise, competenceLevelPromise],
    );
    if (_.isNil(internalDepartment)) {
      throw new Error(`Recognition Scheduler: internal department "${NA_NAME}" does not exist for lsp: ${this.lsp._id}. Stopping runner.`);
    }
    if (_.isNil(competenceLevel)) {
      throw new Error(`Recognition Scheduler: competence level "${NA_NAME}" does not exist for lsp: ${this.lsp._id}. Stopping runner.`);
    }
    this.internalDepartment = internalDepartment;
    this.competenceLevel = competenceLevel;
  }

  getCursorToRun() {
    const pipeline = [{
      $match: {
        $and: [
          { lspId: this.lsp._id },
          { workflowType: 'Auto Scan PDF to MT Text', status: { $ne: 'Completed' }, isAutoTranslateSchedulerRunning: false },
          { 'languageCombinations.documents.0': { $exists: true } },
          {
            languageCombinations: {
              $elemMatch: {
                documents: {
                  $elemMatch: {
                    $or: [{
                      OCRStatus: 'processing',
                    }, {
                      OCRStatus: 'processing_complete',
                    }],
                  },
                },
              },
            },
          },
          { 'languageCombinations.documents.name': { $nin: mockFileNames } },
        ],
      },
    }];
    return this.schema.Request.aggregate(pipeline)
      .cursor({ batchSize: 1 });
  }

  getTranslatedFileName(fileName, lang) {
    const splitted = fileName.split('.');
    const extension = this.isPdfOutputEnabledForLSP() ? 'pdf' : 'txt';
    splitted.pop();
    const name = splitted.join('.');
    return `${name}_${lang}.${extension}`;
  }

  getTranslatedRate(company, languageCombination, translationUnit) {
    const rates = _.get(company, 'billingInformation.rates', []);
    const rate = rates.find(rateFilterFactory(AUTO_SCAN_ABILITY_TRANSLATED, languageCombination));
    if (!rate) return { price: 0 };
    const foundRate = rate.rateDetails
      .find((rd) => rd.translationUnit.toString() === translationUnit._id.toString());
    return foundRate || { price: 0 };
  }

  getSkippedRate(company, languageCombination, translationUnit) {
    const rates = _.get(company, 'billingInformation.rates', []);
    const rate = rates.find(rateFilterFactory(AUTO_SCAN_ABILITY_SKIPPED, languageCombination));
    if (!rate) return { price: 0 };
    const foundRate = rate.rateDetails
      .find((rd) => rd.translationUnit.toString() === translationUnit._id.toString());
    return foundRate || { price: 0 };
  }

  async getTranslationUnit() {
    return this.schema.TranslationUnit.findOneWithDeleted({
      name: 'Files',
      lspId: this.lsp._id,
    });
  }

  createTask({
    abilityText, unitPrice, quantity, translationUnit, status,
  }) {
    return {
      minCharge: 0,
      foreignMinCharge: 0,
      total: unitPrice * quantity,
      foreignTotal: unitPrice * quantity,
      ability: abilityText,
      description: abilityText,
      taskDueDate: new Date(),
      invoiceDetails: [{
        projectedCost: {
          translationUnit: {
            name: translationUnit.name,
            _id: translationUnit._id,
          },
          foreignTotal: 0,
          total: 0,
          unitPrice: 0,
          quantity: 0,
        },
        invoice: {
          foreignUnitPrice: unitPrice,
          unitPrice,
          foreignTotal: unitPrice * quantity,
          total: unitPrice * quantity,
          translationUnit: {
            name: translationUnit.name,
            _id: translationUnit._id,
          },
          quantity,
        },
      }],
      providerTasks: [
        {
          status,
          minCharge: 0,
          taskDueDate: new Date(),
          provider: {
            name: 'Auto Scan PDF to MT Text',
            _id: new ObjectId(),
          },
          files: [],
          notes: '',
          quantity: [
            {
              amount: quantity,
              units: translationUnit.name,
            },
          ],
          billDetails: [
            {
              unitPrice: 0,
              total: 0,
              translationUnit: {
                name: translationUnit.name,
                _id: translationUnit._id,
              },
              quantity: 0,
            },
          ],
          priorityStatus: 'completed',
        }],
    };
  }

  getTasksIds(request) {
    let successIds = null;
    let errorIds = null;
    request.workflows.forEach((w) => {
      w.tasks.forEach((t) => {
        if (t.ability === AUTO_SCAN_ABILITY_TRANSLATED && !successIds) {
          successIds = {
            workflowId: w._id,
            taskId: t._id,
            providerTaskId: t.providerTasks[0]._id,
          };
        }
        if (t.ability === AUTO_SCAN_ABILITY_SKIPPED && !errorIds) {
          errorIds = {
            workflowId: w._id,
            taskId: t._id,
            providerTaskId: t.providerTasks[0]._id,
          };
        }
      });
    });
    return { successIds, errorIds };
  }

  addCostsToTask(task, price, quantity) {
    const total = price * quantity;
    task.total = sum(task.total, total);
    task.foreignTotal = sum(task.foreignTotal, total);
    task.invoiceDetails[0].invoice.total = sum(task.invoiceDetails[0].invoice.total, total);
    task.invoiceDetails[0].invoice.foreignTotal = sum(task.invoiceDetails[0].invoice.foreignTotal, total);
    task.invoiceDetails[0].invoice.quantity += quantity;
  }

  addOrUpdateTask(workflow, files, ability, rate, unit) {
    const existingTask = workflow.tasks.find((task) => task.ability === ability);
    if (existingTask) {
      this.addCostsToTask(existingTask, rate.price, files.length);
    } else {
      const task = this.createTask({
        abilityText: AUTO_SCAN_ABILITY_TRANSLATED,
        unitPrice: rate.price,
        quantity: files.length,
        unit,
        status: 'approved',
      });
      workflow.tasks.push(task);
    }
  }

  async updateWorkflow(request, successFiles, errorFiles, workflowId) {
    const newRequest = _.clone(request);
    const workflowToUpdate = newRequest.workflows
      .find((w) => w._id.toString() === workflowId.toString());
    const company = await this.schema.Company.findOneWithDeleted(
      { _id: request.company._id, lspId: this.lsp._id },
      '_id billingInformation',
    );
    const translationUnit = await this.getTranslationUnit();

    if (successFiles.length > 0) {
      const translatedRate = this.getTranslatedRate(company, request.languageCombinations[0], translationUnit);
      this.addOrUpdateTask(
        workflowToUpdate,
        successFiles,
        AUTO_SCAN_ABILITY_TRANSLATED,
        translatedRate,
        translationUnit,
      );
    }
    if (errorFiles.length > 0) {
      const skippedRate = this.getSkippedRate(company, request.languageCombinations[0], translationUnit);
      this.addOrUpdateTask(workflowToUpdate, errorFiles, AUTO_SCAN_ABILITY_SKIPPED, skippedRate, translationUnit);
    }
    const dbRequest = await this.updateRequest(request, newRequest);
    return this.getTasksIds(dbRequest);
  }

  async updateRequestFiles(request, successFiles, errorFiles) {
    const filter = { _id: request._id, lspId: this.lsp._id };
    await this.schema.Request.bulkWrite([{
      updateOne: {
        filter,
        update: {
          $set: {
            'languageCombinations.$[].documents.$[d].isTranslated': false,
          },
        },
        upsert: false,
        arrayFilters: [
          { 'd._id': { $in: errorFiles.map((f) => new ObjectId(f.sourceFile._id)) } },
        ],
      },
    }, {
      updateOne: {
        filter,
        update: {
          $set: {
            'languageCombinations.$[].documents.$[d].isTranslated': true,
          },
        },
        upsert: false,
        arrayFilters: [
          { 'd._id': { $in: successFiles.map((f) => new ObjectId(f.sourceFile._id)) } },
        ],
      },
    }]);
  }

  createTaskFileObject(metadata) {
    return {
      name: fileUtils.getFilename(_.get(metadata, 'name')),
      mime: metadata.contentType,
      size: metadata.size,
      cloudKey: metadata.name,
      md5Hash: metadata.md5Hash,
      ip: null,
      user: null,
      createdBy: null,
      createdAt: metadata.timeCreated,
      final: true,
      completed: true,
    };
  }

  async createOrUpdateWorkflows(request, successFiles, errorFiles) {
    const existingWorkflow = request.workflows.find((w) => _.get(w, 'srcLang.isoCode', '') === _.get(request, 'languageCombinations[0].srcLangs[0].isoCode', '')
      && _.get(w, 'tgtLang.isoCode', '') === _.get(request, 'languageCombinations[0].tgtLangs[0].isoCode', ''));
    if (existingWorkflow) {
      return this.updateWorkflow(request, successFiles, errorFiles, existingWorkflow._id);
    }
    return this.createWorkflow(request, successFiles, errorFiles);
  }

  async updateRequest(request, newRequest) {
    const dbRequest = await this.schema.Request.findOne({ _id: request._id, lspId: this.lsp._id });
    await requestAPIHelper.generateWorkflowsIds(newRequest.workflows);
    const workflowTaskUpdater = new WorkflowTaskUpdater(
      newRequest.workflows,
      {
        user: sampleUser,
        fileStorageFacade: this.fileStorageFacade,
        logger: this.logger,
        configuration,
      },
    );
    const workflowUpdater = new WorkflowUpdater(sampleUser, newRequest, request, { workflowTaskUpdater });
    await workflowUpdater.applyUpdate(dbRequest);
    await workflowTaskUpdater.applyUpdate(dbRequest);
    await this.schema.Request.updateWorkflowTotals(dbRequest);
    await dbRequest.save();
    return dbRequest;
  }

  async createWorkflow(request, successFiles, errorFiles) {
    const workflowToPush = {
      subtotal: 0,
      foreignSubtotal: 0,
      projectedCostTotal: 0,
      workflowDueDate: new Date(),
      srcLang: request.languageCombinations[0].srcLangs[0],
      tgtLang: request.languageCombinations[0].tgtLangs[0],
      tasks: [],
    };
    const company = await this.schema.Company.findOneWithDeleted(
      { _id: request.company._id, lspId: this.lsp._id },
      '_id billingInformation',
    );
    const translationUnit = await this.getTranslationUnit();
    const translatedRate = this.getTranslatedRate(company, request.languageCombinations[0], translationUnit);
    const skippedRate = this.getSkippedRate(company, request.languageCombinations[0], translationUnit);

    if (successFiles.length > 0) {
      const successTask = this.createTask({
        abilityText: AUTO_SCAN_ABILITY_TRANSLATED,
        unitPrice: translatedRate.price,
        quantity: successFiles.length,
        translationUnit,
        status: 'approved',
      });
      workflowToPush.tasks.push(successTask);
    }
    if (errorFiles.length > 0) {
      const errorTask = this.createTask({
        abilityText: AUTO_SCAN_ABILITY_SKIPPED,
        unitPrice: skippedRate.price,
        quantity: errorFiles.length,
        translationUnit,
        status: 'approved',
      });
      workflowToPush.tasks.push(errorTask);
    }
    const newRequest = _.clone(request);
    newRequest.workflows.push(workflowToPush);
    const dbRequest = await this.updateRequest(request, newRequest);
    return this.getTasksIds(dbRequest);
  }

  async setFileOCRReady(file, request) {
    await this.schema.Request.bulkWrite([{
      updateOne: {
        filter: { _id: request._id, lspId: this.lsp._id },
        update: {
          $set: {
            'languageCombinations.$[].documents.$[d].OCRStatus': 'processing_complete',
            'languageCombinations.$[].documents.$[d].OCRFinishedAt': new Date(),
          },
        },
        upsert: false,
        arrayFilters: [
          { 'd._id': new ObjectId(file._id) },
        ],
      },
    }]);
  }

  async processFile(file, request) {
    try {
      const isAnnotationReady = await this.visionService
        .checkAnnotationReady(file.OCROperationCode);
      this.logger.info(`File ${file.name} for request ${request._id} is OCRed. Starting translation.`);
      if (!isAnnotationReady) return;
      await this.setFileOCRReady(file, request);
      const destination = this.filePathFactory
        .translationOCRFolder(request.company, request, file.name);
      const recognitionInfo = await this.visionService
        .getRecognitionInfo(destination, file.name);
      if (!this.lsp.autoTranslateSettings.minimumConfidenceLevel) return;
      const isEnoughConfidence = this.visionService
        .checkConfidence(recognitionInfo, this.lsp.autoTranslateSettings.minimumConfidenceLevel);
      if (!isEnoughConfidence) {
        this.logger.info(`File ${file.name} for request ${request._id} has not enough confidence to be translated.`);
        return {
          error: true,
          file: { name: this.getTranslatedFileName(file.name, file.targetLanguage.isoCode), translatedText: [{ paragraphs: ['One of the pages has low confidence level'] }], sourceFile: file },
        };
      }
      const pages = this.visionService.transformRecognitionInfo(recognitionInfo, file.name);
      const translationPromises = pages.map(async (page) => {
        const [paragraphs] = await this.translationService
          .translate(page.paragraphs.map((p) => p.text), file.targetLanguage.isoCode);
        return { paragraphs };
      });
      const translatedPages = await Promise.all(translationPromises);
      this.logger.info(`File ${file.name} for request ${request._id} finished translating.`);
      return {
        error: false,
        file: {
          name: this.getTranslatedFileName(file.name, file.targetLanguage.isoCode),
          translatedText: translatedPages,
          sourceFile: file,
        },
      };
    } catch (e) {
      this.logger.error(`Unexpected error happened while translating file ${file.name} for request ${request._id}. Message: ${e.message}. Stack: ${e.stack}`);
      return {
        error: true,
        file: { name: this.getTranslatedFileName(file.name, file.targetLanguage.isoCode), translatedText: [{ paragraphs: ['Unexpected error happened during translation. Contact your administrator.'] }], sourceFile: file },
      };
    }
  }

  async processFiles(files, request) {
    const successFiles = [];
    const errorFiles = [];
    await Promise.mapSeries(files, async (file) => {
      const result = await this.processFile(file, request);
      if (result.error) {
        errorFiles.push(result.file);
      } else {
        successFiles.push(result.file);
      }
    });
    return { successFiles, errorFiles };
  }

  async updateTasks(successFilesMetadata, errorFilesMetadata, successIds, errorIds, request) {
    const bucket = chooseProperBucket(configuration);
    const requestTaskAPI = new RequestTaskApi({
      user: sampleUser,
      configuration,
      log: this.logger,
      bucket,
    });
    const successFiles = successFilesMetadata.map(this.createTaskFileObject);
    const errorFiles = errorFilesMetadata.map(this.createTaskFileObject);
    const successPromises = successFiles.map((file) => requestTaskAPI.handleFileUpload({
      translationRequest: request,
      workflowId: successIds.workflowId,
      taskId: successIds.taskId,
      providerTaskId: successIds.providerTaskId,
      newDocument: file,
    }));
    const errorPromises = errorFiles.map((file) => requestTaskAPI.handleFileUpload({
      translationRequest: request,
      workflowId: errorIds.workflowId,
      taskId: errorIds.taskId,
      providerTaskId: errorIds.providerTaskId,
      newDocument: file,
    }));
    await Promise.all([...successPromises, ...errorPromises]);
  }

  async lockRequest(request) {
    await this.schema.Request.findOneAndUpdate(
      { _id: request._id, lspId: this.lsp._id },
      { $set: { isAutoTranslateSchedulerRunning: true } },
    );
  }

  async unlockRequest(request) {
    await this.schema.Request.findOneAndUpdate(
      { _id: request._id, lspId: this.lsp._id },
      { $set: { isAutoTranslateSchedulerRunning: false } },
    );
  }

  async processOneRequest(request) {
    try {
      this.logger.info(`Translation started for request ${request._id}`);
      await this.lockRequest(request);
      const files = [];
      request.languageCombinations.forEach((combination) => combination.documents.forEach((file) => {
        if (file.isTranslated === null && file.OCRStatus.match(/processing/)) {
          files.push({ ...file, targetLanguage: combination.tgtLangs[0] });
        }
      }));
      const { successFiles, errorFiles } = await this.processFiles(files, request);
      if (successFiles.length || errorFiles.length) {
        const { successIds, errorIds } = await this.createOrUpdateWorkflows(request, successFiles, errorFiles);
        const { successFilesMetadata, errorFilesMetadata } = await this.generateAndUploadFiles(successFiles, errorFiles, successIds, errorIds, request);
        await this.updateTasks(successFilesMetadata, errorFilesMetadata, successIds, errorIds, request);
        await this.updateRequestFiles(request, successFiles, errorFiles);
      }
      await this.getNAEntities();
      await this.updateRequestStatusAndEntities(request);
      this.logger.info(`Translation finished for request ${request._id}`);
    } catch (e) {
      this.logger.error(`Error translating request ${request._id}. Message: ${e.message}. Stack: ${e.stack}`);
      throw e;
    } finally {
      await this.unlockRequest(request);
    }
  }

  async updateRequestStatusAndEntities(request) {
    await this.schema.Request.findOneAndUpdate({
      _id: request._id,
      lspId: this.lsp._id,
      'languageCombinations.documents.isTranslated': { $ne: null },
      'languageCombinations.documents.0': { $exists: true },
    }, {
      $set: { status: 'Completed', internalDepartment: this.internalDepartment, competenceLevels: [this.competenceLevel] },
    });
  }

  async generateAndUploadPdfFile(file, request, taskId) {
    const path = this.filePathFactory.translationRequestTaskFile(
      request.company,
      request,
      taskId,
      file.name,
    );
    const { gcsFile, gcsWriteStream } = this.cloudStorage.getUploadWriteStream(path);
    const pdfFile = this.makePdf(file);
    pdfFile.pipe(gcsWriteStream);
    pdfFile.end();
    await streamToPromise(gcsWriteStream);
    const [fileInfo] = await gcsFile.getMetadata();
    this.logger.info(`Finished uploading translated file ${file.name} for request ${request._id}.`);
    return fileInfo;
  }

  async generateAndUploadTxtFile(file, request, taskId) {
    const path = this.filePathFactory.translationRequestTaskFile(
      request.company,
      request,
      taskId,
      file.name,
    );
    const { gcsFile, gcsWriteStream } = this.cloudStorage.getUploadWriteStream(path);
    await new Promise((resolve) => {
      gcsWriteStream.on('finish', resolve);
      file.translatedText.forEach((page) => {
        page.paragraphs.forEach((paragraph) => {
          gcsWriteStream.write(`${paragraph}\n`);
        });
      });
      gcsWriteStream.end();
    });
    const [fileInfo] = await gcsFile.getMetadata();
    this.logger.info(`Finished uploading translated file ${file.name} for request ${request._id}.`);
    return fileInfo;
  }

  isPdfOutputEnabledForLSP() {
    return this.lsp.autoTranslateSettings.fileOutput === 'Unformatted PDF';
  }

  async generateAndUploadFile(file, request, taskId) {
    this.logger.info(`Started uploading translated file ${file.name} for request ${request._id}.`);
    if (this.isPdfOutputEnabledForLSP()) {
      return this.generateAndUploadPdfFile(file, request, taskId);
    }
    return this.generateAndUploadTxtFile(file, request, taskId);
  }

  async generateAndUploadFiles(successFiles, errorFiles, successIds, errorIds, request) {
    const successFilesPromises = Promise.mapSeries(
      successFiles,
      (file) => this.generateAndUploadFile(file, request, successIds.taskId),
    );
    const errorFilesPromises = Promise.mapSeries(
      errorFiles,
      (file) => this.generateAndUploadFile(file, request, errorIds.taskId),
    );
    const [successFilesMetadata, errorFilesMetadata] = await Promise.all(
      [successFilesPromises, errorFilesPromises],
    );
    return { successFilesMetadata, errorFilesMetadata };
  }

  async processCursor(cursor) {
    await cursor.eachAsync((request) => this.processOneRequest(request));
  }

  makePdf(file) {
    const docDefinition = _.cloneDeep(PDF_DOC_DEFINITION);

    file.translatedText.forEach((page, k) => {
      page.paragraphs.forEach((paragraph, i) => {
        const pageBreak = (i === page.paragraphs.length - 1 && k !== file.translatedText.length - 1) ? 'after' : null;
        docDefinition.content.push({ text: paragraph, pageBreak });
      });
    });

    const instance = new PdfMake(PDF_FONTS_DESCRIPTOR);
    return instance.createPdfKitDocument(docDefinition);
  }

  async processOneRequestWithNAEntities(request) {
    await this.getNAEntities();
    await this.processOneRequest(request);
  }

  async runAll() {
    const cursor = await this.getCursorToRun();
    await this.processCursor(cursor);
  }
}

module.exports = TranslationRunner;
