const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const { Types: { ObjectId } } = require('mongoose');
const path = require('path');
const logger = require('../../log/scheduler-logger');
const { generateWorkflowsIds } = require('../../../endpoints/lsp/request/request-api-helper');
const CloudStorage = require('../../cloud-storage');
const FileStorageFacade = require('../../file-storage');
const FilePathFactory = require('../../file-storage/file-path-factory');
const fileUtils = require('../../../utils/file');
const mongooseSchema = require('../../database/mongo').models;

const TASK_FILE_TIMEOUT = 3000;

class AutoPmTasksScheduler {
  constructor(configuration) {
    this.configuration = configuration;
    this.logger = logger;
    this.cloudStorage = new CloudStorage(this.configuration);
    this.filePathFactory = new FilePathFactory(this.lspId, this.configuration);
  }

  async generateTaskFilePath({
    lspId,
    companyId,
    requestId,
    fileName,
  }) {
    const documentId = new ObjectId().toString();
    const fileStorageFacade = new FileStorageFacade(lspId, this.configuration, this.logger);
    const file = fileStorageFacade.translationRequestFinalFile(companyId, requestId, fileName);
    return { documentId, filePath: file.path };
  }

  createTask({
    abilityText, unitPrice, quantity, translationUnit,
  }) {
    return {
      total: unitPrice * quantity,
      foreignTotal: unitPrice * quantity,
      ability: abilityText,
      description: abilityText,
      taskDueDate: moment.utc().toDate(),
      invoiceDetails: [{
        projectedCost: {
          translationUnit: {
            name: translationUnit.name,
            _id: translationUnit._id,
          },
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
      providerTasks: [{
        minCharge: 0,
        taskDueDate: moment.utc(),
        files: [],
        notes: '',
        status: 'approved',
        approvedAt: moment.utc().toDate(),
        approvedBy: 'SYSTEM',
        quantity: [{
          amount: quantity,
          units: translationUnit.name,
        }],
        billDetails: [{
          unitPrice: 0,
          total: 0,
          translationUnit: {
            name: translationUnit.name,
            _id: translationUnit._id,
          },
          quantity: 0,
        }],
      }],
    };
  }

  async createWorkflow(request) {
    const languageCombinations = _.get(request, 'languageCombinations', []);
    if (_.isEmpty(languageCombinations)) {
      throw new Error(`There are no language combinations for the request _id=${request._id}`);
    }
    const languagePairs = [];
    await Promise.map(languageCombinations, async ({ srcLangs, tgtLangs, documents }) => {
      if (_.isEmpty(documents)) {
        return;
      }
      Promise.map(srcLangs, (srcLang) => {
        Promise.map(tgtLangs, (tgtLang) => {
          languagePairs.push({ srcLang, tgtLang, documents });
        });
      });
    });
    const translationUnit = await mongooseSchema.TranslationUnit.find({ name: 'Hour', lspId: new ObjectId(request.lspId) });
    const workflows = await Promise.map(languagePairs, async (languagePair) => {
      const { srcLang, tgtLang, documents } = languagePair;
      const { lspId, _id, company } = request;
      const task = await this.createTask({
        abilityText: 'Validation and Delivery',
        unitPrice: 0,
        quantity: 1,
        translationUnit: translationUnit[0],
      });
      const workflow = {
        srcLang,
        tgtLang,
        workflowDueDate: moment.utc().toDate(),
        tasks: [task],
      };
      await generateWorkflowsIds([workflow]);
      const taskFiles = await Promise.map(documents, async (doc) => {
        const srcFileExtension = path.extname(doc.name);
        const srcFileName = path.parse(doc.name).name;
        const fileName = `${srcFileName}_${tgtLang.isoCode}${srcFileExtension}`;
        const { cloudKey } = doc;
        const { documentId, filePath } = await this.generateTaskFilePath({
          lspId,
          companyId: company._id,
          requestId: _id,
          fileName,
        });
        const [taskFile, metadata] = await this.cloudStorage.gcsCopyFile(cloudKey, filePath);
        const { md5Hash, size } = metadata;
        await this.cloudStorage.gcpAssertFileExists(taskFile.name, TASK_FILE_TIMEOUT);
        return {
          _id: documentId,
          name: fileUtils.getFilename(taskFile.name),
          mime: doc.mime,
          cloudKey,
          language: tgtLang,
          encoding: doc.encoding,
          size,
          completed: false,
          final: true,
          md5Hash,
          createdBy: 'SYSTEM',
          createdAt: moment().utc().toDate(),
        };
      });
      workflow.tasks[0].providerTasks[0].files = taskFiles;
      return workflow;
    });

    await Promise.map(workflows, (workflow) => {
      request.workflows.push(workflow);
    });
    await request.save();
    await mongooseSchema.Request.updateWorkflowTotals(request);
  }

  async setFinalDocuments(request) {
    request.finalDocuments = [];
    await Promise.map(request.workflows, (workflow) => Promise.map(workflow.tasks, (task) => Promise.map(task.providerTasks, (providerTask) => Promise.map(providerTask.files, (file) => request.finalDocuments.push(file)))));
    await request.save();
  }

  shouldRunScheduler(request) {
    return request.languageCombinations.every((l) => l.documents.length > 0);
  }

  async run(job, done) {
    try {
      await mongooseSchema.Request.find({ mockPm: true })
        .cursor()
        .eachAsync(async (request) => {
          this.lspId = request.lspId;
          if (this.shouldRunScheduler(request)) {
            await this.createWorkflow(request);
            await this.setFinalDocuments(request);
            await mongooseSchema.Request.findOneAndUpdate(
              { _id: request._id },
              { $set: { mockPm: false } },
              { upsert: true },
            );
            this.logger.debug(`Finished executing scheduler. lspId: ${this.lspId}`);
            return done();
          }
          this.logger.error(`Error: The request ${request.no} has no documents for all language combinations`);
        });
      this.logger.debug(`Finished executing scheduler. lspId:${this.lspId}`);
      done();
    } catch (error) {
      this.logger.error(`Error executing scheduler: ${JSON.stringify(error)}. lspId:${this.lspId}`);
      done(error);
    }
  }
}

module.exports = AutoPmTasksScheduler;
