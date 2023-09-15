const _ = require('lodash');
const logger = require('../log/logger');
const FilePathFactory = require('../file-storage/file-path-factory');
const GoogleVisionService = require('./google-vision-service');
const GoogleVisionMockService = require('./google-vision-mock-service');
const configuration = require('../configuration');

const environmentConfig = configuration.environment;
const mockFileNames = ['LSP-271_E2E_TEST_PDF_1.pdf', 'LSP-271_E2E_TEST_PDF_2.pdf', 'LSP-271_E2E_TEST_PDF_ERROR.pdf'];
const NA_NAME = 'NA';

class RecognitionRunner {
  constructor(schema, lsp, flags) {
    this.schema = schema;
    this.lsp = lsp;
    this.flags = flags;
    this.logger = logger;
    this.visionService = _.get(this, 'flags.mock', false) ? new GoogleVisionMockService() : new GoogleVisionService(this.logger);
    this.filePathFactory = new FilePathFactory(this.lsp._id, configuration);
    this.gcsPrefix = `gs://${environmentConfig.GCS_BUCKET}`;
  }

  async checkNAEntitiesExist() {
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
                    OCRStatus: 'not_sent',
                    name: { $nin: mockFileNames },
                  },
                },
              },
            },
          },
        ],
      },
    }];
    return this.schema.Request.aggregate(pipeline)
      .cursor({ batchSize: 1 });
  }

  async sendOneFileToRecognition(file, request) {
    const destination = `${this.filePathFactory.translationOCRFolder(request.company, request, file.name)}/`;
    const data = {
      operation: await this.visionService.batchAnnotateFiles(`${this.gcsPrefix}/${file.cloudKey}`, `${this.gcsPrefix}/${destination}`, destination),
      destination,
    };
    this.logger.info(`File ${file.name} for ${request._id} sent to recognition.`);
    return data;
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
      this.logger.info(`Recognition started for request ${request._id}`);
      await this.lockRequest(request);
      const files = [];
      const newLanguageCombinations = _.cloneDeep(request.languageCombinations);
      newLanguageCombinations.forEach((combination) => combination.documents.forEach((file) => {
        if (file.OCRStatus === 'not_sent') {
          files.push(file);
        }
      }));
      const promises = files.map((file) => this.sendOneFileToRecognition(file, request));
      const data = await Promise.all(promises);
      data.forEach((fileRecognitionData, i) => {
        const d = fileRecognitionData.operation[1];
        Object.assign(files[i], {
          OCRStatus: _.get(this, 'flags.mock') ? 'processing_complete' : 'processing',
          OCROperationCode: d.name,
          OCRCloudKey: fileRecognitionData.destination,
        });
      });
      await this.schema.Request.findOneAndUpdate(
        { _id: request._id },
        { $set: { languageCombinations: newLanguageCombinations } },
      );
      this.logger.info(`Files sent to recognition for ${request._id}`);
    } catch (e) {
      this.logger.error(`Files were not sent to recognition for ${request._id} because of error: ${e.message}. ${e.stack}`);
      throw e;
    } finally {
      await this.unlockRequest(request);
    }
  }

  async processCursor(cursor) {
    await cursor.eachAsync((request) => this.processOneRequest(request));
  }

  async processOneRequestWithNAEntities(request) {
    await this.checkNAEntitiesExist();
    await this.processOneRequest(request);
  }

  async runAll() {
    await this.checkNAEntitiesExist();
    const cursor = await this.getCursorToRun();
    await this.processCursor(cursor);
  }
}

module.exports = RecognitionRunner;
