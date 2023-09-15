const moment = require('moment');
const { Types: { ObjectId } } = require('mongoose');
const logger = require('../log/logger');
const FilePathFactory = require('../file-storage/file-path-factory');
const configuration = require('../configuration');
const CloudStorage = require('../cloud-storage');
const FileStorageFacade = require('../file-storage');

class OCRDataDeletingRunner {
  constructor(schema, lsp, flags) {
    this.schema = schema;
    this.lsp = lsp;
    this.logger = logger;
    this.flags = flags;
    this.filePathFactory = new FilePathFactory(this.lsp._id, configuration);
    this.fileStorageFacade = new FileStorageFacade(this.lsp._id, configuration, this.logger);
    this.cloudStorage = new CloudStorage(configuration);
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

  getCursorToRun(previousDate) {
    const pipeline = [{
      $match: {
        $and: [
          { lspId: this.lsp._id },
          { workflowType: 'Auto Scan PDF to MT Text', status: 'Completed', isAutoTranslateSchedulerRunning: false },
          {
            languageCombinations: {
              $elemMatch: {
                documents: {
                  $elemMatch: {
                    OCRFinishedAt: { $lt: previousDate },
                    OCRCloudKey: { $exists: true, $ne: null },
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

  async deleteOCRFiles(file) {
    const files = await this.cloudStorage.gcsListFilesWithPrefix(file);
    await Promise.all(files.map((f) => this.cloudStorage.gcsDeleteFile(f.metadata.name)));
  }

  async updateRequestFiles(request, files) {
    const filter = { _id: request._id, lspId: this.lsp._id };
    await this.schema.Request.bulkWrite([{
      updateOne: {
        filter,
        update: {
          $unset: {
            'languageCombinations.$[].documents.$[d].OCRCloudKey': 1,
          },
        },
        upsert: false,
        arrayFilters: [
          { 'd._id': { $in: files.map((f) => new ObjectId(f._id)) } },
        ],
      },
    }]);
  }

  async processOneRequest(request, date) {
    this.logger.info(`Deleting OCR files older then ${date} started for request ${request._id}`);
    await this.lockRequest(request);
    const filesToDelete = [];
    request.languageCombinations.forEach((combination) => combination.documents.forEach((file) => {
      const OCRDate = moment(file.OCRFinishedAt, 'YYYY-MM-DDThh:mm:ssZ');
      if (OCRDate.isBefore(date) && file.OCRCloudKey) {
        filesToDelete.push(file);
      }
    }));
    await Promise.all(filesToDelete.map((file) => this.deleteOCRFiles(file.OCRCloudKey)));
    await this.updateRequestFiles(request, filesToDelete);
    await this.unlockRequest(request);
    this.logger.info(`Deleting OCR files older then ${date} finished for request ${request._id}`);
  }

  async processCursor(cursor) {
    await cursor.eachAsync((request) => this.processOneRequest(request));
  }

  async runAll(date) {
    const previousDate = moment(date).subtract(30, 'days').toDate();
    const cursor = await this.getCursorToRun(previousDate);
    await this.processCursor(cursor, previousDate);
  }
}

module.exports = OCRDataDeletingRunner;
