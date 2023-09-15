const _ = require('lodash');
const mongoose = require('mongoose');
const { models: mongooseSchema } = require('../../../components/database/mongo');
const BillAdjustmentAPI = require('./bill-adjustment-api');
const CloudStorage = require('../../../components/cloud-storage');
const FileStorageFacade = require('../../../components/file-storage');
const { RestError } = require('../../../components/api-response');

const { ObjectId } = mongoose.Types;

class BillAdjustmentDocumentApi {
  constructor(options) {
    this.logger = options.log;
    this.configuration = options.configuration;
    this.billAdjustmentAPI = new BillAdjustmentAPI(options);
    this.cloudStorage = new CloudStorage(this.configuration, this.logger);
  }

  async saveFile(params) {
    const { billAdjustment, newDocument } = params;
    const { _id, lspId } = billAdjustment;
    const update = {
      $addToSet: {
        documents: newDocument,
      },
    };

    await mongooseSchema.BillAdjustment.findOneAndUpdate({ _id, lspId }, update).exec();
  }

  async handleFileUpload(params) {
    const { newDocument } = params;

    if (!_.isNil(newDocument)) {
      this.logger.info(`Bill Adjustment API: About to save file: ${newDocument.name} in db`);
      return this.saveFile(params);
    }
  }

  generateFilePath(interceptorParams) {
    let documentId = new mongoose.Types.ObjectId().toString();
    const {
      lspId,
      billAdjustment,
      billAdjustmentId,
      filename,
    } = interceptorParams;
    const duplicatedDocument = billAdjustment.documents.find((d) => d.name === filename);

    if (!_.isNil(duplicatedDocument)) {
      documentId = duplicatedDocument._id.toString();
    }
    const fileStorageFacade = new FileStorageFacade(lspId, this.configuration, this.logger);
    const file = fileStorageFacade.billAdjustmentFile(billAdjustmentId, filename);
    return { documentId, filePath: file.path };
  }

  async deleteDocument(billAdjustmentId, documentId) {
    const billAdjustment = await this.billAdjustmentAPI.findOne(billAdjustmentId);
    const document = _.find(
      billAdjustment.documents,
      (d) => _.toString(d._id) === _.toString(documentId),
    );
    let updatedBillAdjustment;

    try {
      const query = { _id: new ObjectId(billAdjustment._id), 'documents._id': new ObjectId(documentId) };
      const update = { $set: { 'documents.$.deleted': true } };
      const options = { new: true, multi: false };

      updatedBillAdjustment = await mongooseSchema.BillAdjustment.findOneAndUpdate(query, update, options).lean();
      this.logger.debug(`Removing file with path "${document.cloudKey}" from GCS and AWS`);
      this.cloudStorage.deleteFile(document.cloudKey).catch((err) => {
        const message = _.get(err, 'message', err);

        this.logger.error(`Failed to delete file with id: ${documentId} from Cloud: Err ${message}`);
      });
    } catch (err) {
      this.logger.debug(`Error deleting document "${billAdjustmentId}" ${err}`);
      throw new RestError(400, { message: err.message });
    }
    return updatedBillAdjustment;
  }
}

module.exports = BillAdjustmentDocumentApi;
