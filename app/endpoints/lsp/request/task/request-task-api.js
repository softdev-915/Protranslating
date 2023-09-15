const mongoose = require('mongoose');
const _ = require('lodash');
const Promise = require('bluebird');
const { models: mongooseSchema } = require('../../../../components/database/mongo');
const RequestAPI = require('../request-api');
const RequestDocumentAPI = require('../../company/request/document/request-document-api');
const CloudStorage = require('../../../../components/cloud-storage');
const FileStorageFacade = require('../../../../components/file-storage');
const RequestTaskFiles = require('../../../../utils/translation-request');
const { RestError } = require('../../../../components/api-response');
const { areObjectIdsEqual } = require('../../../../utils/schema');
const { findWorkflowTasks } = require('../workflow-helpers');
const { provideTransaction } = require('../../../../components/database/mongo/utils');

const { Types: { ObjectId } } = mongoose;
const COMPLETED_STATUS = 'completed';
const AUTO_SCAN_ABILITIES = [
  'Auto Scan PDF to MT Translated',
  'Auto Scan PDF to MT Skipped',
];
const FINAL_FILES_ABILITIES = [
  'Validation and Delivery',
  ...AUTO_SCAN_ABILITIES,
];

class RequestTaskAPI {
  constructor(options) {
    this.logger = options.log;
    this.configuration = options.configuration;
    this.requestAPI = new RequestAPI(options);
    this.requestDocumentAPI = new RequestDocumentAPI(options);
    this.cloudStorage = new CloudStorage(this.configuration, this.logger);
  }

  async serveTaskFilesZip(user, request, res) {
    const requestTaskFiles = new RequestTaskFiles(this.logger, this.requestAPI);
    const requestWithTask = await requestTaskFiles.retrieveRequestTaskFiles(user, request);
    const requestNo = _.get(requestWithTask, 'request.no', request._id);
    const { task } = requestWithTask;
    const providerTask = task.providerTasks.find((p) => areObjectIdsEqual(p, request.providerTask));
    const files = providerTask.files.filter((f) => !f.deleted && !f.deletedByRetentionPolicyAt);

    this.logger.info(`Preparing zip download for task ${request.task}`);
    try {
      await this.cloudStorage.streamZipFile({ res, files, zipFileName: `${requestNo}.zip` });
    } catch (err) {
      const message = _.get(err, 'message', err);

      this.logger.error(`Error writing zip file. Error: ${message}`);
      throw new RestError(500, { message: 'Error generating zip file', stack: err.stack });
    }
  }

  async saveProviderTaskFile(params) {
    const {
      translationRequest, workflowId, taskId, providerTaskId, newDocument,
    } = params;
    const { _id, lspId } = translationRequest;
    const dbRequest = await mongooseSchema.Request.findOne({
      _id,
      lspId,
      workflows: {
        $elemMatch: {
          'tasks.providerTasks._id': new mongoose.Types.ObjectId(providerTaskId),
        },
      },
    }, { workflows: 1 });

    if (_.isEmpty(_.get(dbRequest, 'workflows', []))) {
      throw new Error('Request has no workflows');
    }
    const { task, providerTask } = findWorkflowTasks(translationRequest, params);
    const providerTaskFile = providerTask.files.find((f) => f.name === newDocument.name);
    const isFinalFile = FINAL_FILES_ABILITIES.includes(_.get(task, 'ability', ''));
    Object.assign(newDocument, {
      final: isFinalFile,
      completed: providerTask.status === COMPLETED_STATUS || AUTO_SCAN_ABILITIES.includes(_.get(task, 'ability', '')),
    });
    let update;
    const options = {
      arrayFilters: [
        { 'workflow._id': new mongoose.Types.ObjectId(workflowId) },
        { 'task._id': new mongoose.Types.ObjectId(taskId) },
        { 'providerTask._id': new mongoose.Types.ObjectId(providerTaskId) },
      ],
    };
    if (!_.isNil(providerTaskFile)) {
      update = {
        $set: {
          'workflows.$[workflow].updatedAt': new Date(),
          'workflows.$[workflow].tasks.$[task].providerTasks.$[providerTask].files.$[file]': newDocument,
        },
      };
      options.arrayFilters.push({ 'file.name': newDocument.name });
    } else {
      update = {
        $set: {
          'workflows.$[workflow].updatedAt': new Date(),
        },
        $addToSet: {
          'workflows.$[workflow].tasks.$[task].providerTasks.$[providerTask].files': newDocument,
        },
      };
    }
    const requestQuery = { _id, lspId };
    await mongooseSchema.Request.findOneAndUpdate(requestQuery, update, options).exec();
  }

  async handleFileUpload(params) {
    const { translationRequest, newDocument } = params;

    if (!_.isNil(newDocument)) {
      this.logger.info(`Request task api: About to save file: ${newDocument.name} in db`);
      const updatePromises = [
        () => this.saveProviderTaskFile(params),
        () => this.requestDocumentAPI.saveRequestFinalFile(params, translationRequest),
      ];
      return Promise.mapSeries(updatePromises, (promise) => {
        this.logger.info(`Request task api: Saving file with name: ${newDocument.name} to db`);
        return promise();
      });
    }
  }

  generateFilePath(interceptorParams) {
    let documentId = new mongoose.Types.ObjectId().toString();
    const {
      lspId,
      req,
      translationRequest,
      companyId,
      requestId,
      filename,
    } = interceptorParams;
    const isFinalFile = _.get(req, 'query.final', false);
    const { providerTask } = findWorkflowTasks(translationRequest, req.params);
    const duplicatedDocument = providerTask.files.find((d) => d.name === filename);

    if (duplicatedDocument) {
      documentId = duplicatedDocument._id.toString();
    }
    let file;
    const { taskId } = req.params;
    const fileStorageFacade = new FileStorageFacade(lspId, this.configuration, this.logger);

    if (isFinalFile) {
      file = fileStorageFacade.translationRequestFinalFile(companyId, requestId, filename, true);
    } else {
      file = fileStorageFacade.translationRequestTaskFile(
        companyId,
        requestId,
        taskId,
        filename,
      );
    }
    return { documentId, filePath: file.path };
  }

  updateProviderTaskTTE(providerTaskFilter, data) {
    return provideTransaction(async (session) => {
      const request = await mongooseSchema.Request.findById(
        providerTaskFilter.requestId,
        { workflows: 1 },
        { session },
      );
      const { providerTask } = findWorkflowTasks(request, providerTaskFilter);
      if (_.isNil(providerTask)) {
        throw new RestError(404, { message: 'Provider task not found' });
      }
      let { segmentEditTime, segmentWordsEdited, segmentTTE } = providerTask;
      segmentEditTime = segmentEditTime === 0
        ? data.segmentEditTime
        : (segmentEditTime + data.segmentEditTime) / 2;
      segmentWordsEdited = segmentWordsEdited === 0
        ? data.segmentWordsEdited
        : (segmentWordsEdited + data.segmentWordsEdited) / 2;
      segmentTTE = segmentTTE === 0
        ? data.segmentTTE
        : (segmentTTE + data.segmentTTE) / 2;
      return mongooseSchema.Request.findOneAndUpdate(
        { _id: Object(providerTaskFilter.requestId) },
        {
          $set: {
            'workflows.$[workflow].tasks.$[task].providerTasks.$[providerTask].segmentEditTime': segmentEditTime,
            'workflows.$[workflow].tasks.$[task].providerTasks.$[providerTask].segmentWordsEdited': segmentWordsEdited,
            'workflows.$[workflow].tasks.$[task].providerTasks.$[providerTask].segmentTTE': segmentTTE,
          },
        },
        {
          arrayFilters: [
            { 'workflow._id': new ObjectId(providerTaskFilter.workflowId) },
            { 'task._id': new ObjectId(providerTaskFilter.taskId) },
            { 'providerTask._id': new ObjectId(providerTaskFilter.providerTaskId) },
          ],
          session,
        },
      );
    });
  }
}

module.exports = RequestTaskAPI;
