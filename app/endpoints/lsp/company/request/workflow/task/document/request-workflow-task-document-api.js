const { Types: { ObjectId } } = global.mongoose || require('mongoose');
const _ = require('lodash');
const SchemaAwareAPI = require('../../../../../../schema-aware-api');
const FileStorageFacade = require('../../../../../../../components/file-storage');
const FileStorageFactory = require('../../../../../../../components/file-storage/file-storage');
const CloudStorage = require('../../../../../../../components/cloud-storage');
const { RestError } = require('../../../../../../../components/api-response');
const RequestAPI = require('../../../../../request/request-api');
const { validObjectId } = require('../../../../../../../utils/schema');
const { forEachProviderTask } = require('../../../../../request/workflow-helpers');

class RequestWorkflowTaskDocumentApi extends SchemaAwareAPI {
  constructor(options) {
    super(options.log, options);
    this.configuration = options.configuration;
    this.FileStorageFacade = FileStorageFacade;
    this.FileStorageFactory = FileStorageFactory;
    this.requestAPI = new RequestAPI(options);
    this.cloudStorage = new CloudStorage(this.configuration);
  }

  getFilePrefixRegex(document) {
    if (document.final) {
      return /[a-zA-Z0-9]{24}\/request_files\/[a-zA-Z0-9]{24}\/[a-zA-Z0-9]{24}\/final/;
    }
    return /[a-zA-Z0-9]{24}\/request_files\/[a-zA-Z0-9]{24}\/[a-zA-Z0-9]{24}\/task\/[a-zA-Z0-9]{24}\/task_files/;
  }

  async findDocument({ request, taskId, documentId }) {
    if (!validObjectId(request)) {
      throw new RestError(400, { message: 'Invalid ObjectID' });
    }
    const dbRequest = await this.schema.Request.findOne({
      _id: new ObjectId(request),
      lspId: this.lspId,
    }, 'workflows documents company');
    const companyId = _.get(dbRequest, 'company._id', request.company).toString();
    let document;
    if (!_.isEmpty(dbRequest.workflows)) {
      let found = false;
      forEachProviderTask(dbRequest, ({ task, providerTask }) => {
        if (!found) {
          if (task.id === taskId && !_.isEmpty(_.get(providerTask, 'files', []))) {
            document = providerTask.files.find((f) => f.id === documentId);
            if (!_.isNil(document)) {
              document.taskId = task.id;
              found = true;
            }
          }
        }
      });
    }
    if (_.isNil(document)) {
      throw new RestError(404, { message: `The document ${documentId} does not exist` });
    } else if (document.deletedByRetentionPolicyAt) {
      // will only be executed if document.deletedByRetentionPolicyAt has a date
      throw new RestError(404, { message: `The document ${documentId} has been removed by document retention policy` });
    }
    const file = this.buildFilePath({ document, request, companyId });
    return { file, request, document };
  }

  async deleteDocument(requestId, taskId, documentId) {
    const { document } = await this.findDocument({ request: requestId, taskId, documentId });
    const query = { _id: new ObjectId(requestId), lspId: this.lspId };
    const update = {
      $pull: {
        'workflows.$[].tasks.$[task].providerTasks.$[].files': { _id: new ObjectId(documentId) },
      },
    };
    const options = {
      multi: false,
      upsert: false,
      arrayFilters: [
        { 'task._id': new ObjectId(taskId) },
      ],
    };
    if (document.final) {
      Object.assign(update.$pull, {
        finalDocuments: { _id: document._id },
      });
    }
    await this.schema.Request.findOneAndUpdate(query, update, options).exec();
    const fileCloudKey = _.get(document, 'cloudKey');
    try {
      this.logger.debug(`Removing file with path "${fileCloudKey}" from GCS and AWS`);
      this.cloudStorage.deleteFile(fileCloudKey);
      this.logger.debug(`Removing document with id: ${documentId}`);
    } catch (err) {
      const message = _.get(err, 'message', err);
      this.logger.error(`Failed to delete file with id: ${documentId} from Cloud: Err ${message}`);
    }
    const updatedRequest = await this.requestAPI.findOne(requestId);
    return updatedRequest;
  }

  async updateDocument({
    request, taskId, documentId, filename, newCloudKey,
  }) {
    const query = { _id: request, lspId: this.lspId };
    const setOperation = {};
    if (!_.isEmpty(newCloudKey)) {
      Object.assign(setOperation, {
        'workflows.$[].tasks.$[task].providerTasks.$[].files.$[file].cloudKey': newCloudKey,
      });
    }
    if (!_.isEmpty(filename)) {
      Object.assign(setOperation, {
        'workflows.$[].tasks.$[task].providerTasks.$[].files.$[file].name': filename,
      });
    }
    if (!_.isEmpty(Object.keys(setOperation))) {
      const update = {
        $set: setOperation,
      };
      const options = {
        multi: false,
        upsert: false,
        arrayFilters: [
          { 'task._id': new ObjectId(taskId) },
          { 'file._id': new ObjectId(documentId) },
        ],
      };
      return this.schema.Request.findOneAndUpdate(query, update, options).exec();
    }
  }

  buildFilePath({ document, request, companyId }) {
    const fileStorage = new this.FileStorageFacade(this.lspId, this.configuration, this.logger);
    if (document.final) {
      return fileStorage.translationRequestFinalFile(companyId, request, document.name);
    }
    return fileStorage.translationRequestTaskFile(
      companyId,
      request,
      document.taskId,
      document.name,
    );
  }
}

module.exports = RequestWorkflowTaskDocumentApi;
