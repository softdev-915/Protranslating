const _ = require('lodash');
const mongoose = require('mongoose');
const moment = require('moment');
const { models: mongooseSchema } = require('../../../components/database/mongo');
const BillAPI = require('./bill-api');
const CloudStorage = require('../../../components/cloud-storage');
const FileStorageFacade = require('../../../components/file-storage');
const { RestError } = require('../../../components/api-response');
const { areObjectIdsEqual } = require('../../../utils/schema');
const { getRoles, hasRole } = require('../../../utils/roles');

const { ObjectId } = mongoose.Types;

class BillDocumentApi {
  constructor(options) {
    this.logger = options.log;
    this.configuration = options.configuration;
    this.billAPI = new BillAPI(options);
    this.cloudStorage = new CloudStorage(this.configuration, this.logger);
    this.user = options.user;
  }

  async saveFile(params) {
    const { newDocument } = params;
    const { _id, lspId } = params.bill;
    const bill = await mongooseSchema.Bill.findOne({ _id, lspId });
    const canUpdateFiles = this._canUpdateFiles(bill.vendor);

    if (!canUpdateFiles) {
      throw new RestError(403, { message: 'User is not authorized' });
    }
    const documents = _.get(bill, 'documents', []);

    bill.documents = _.unionBy([newDocument], documents, 'name');
    await bill.save();
  }

  async handleFileUpload(params) {
    const { newDocument } = params;

    if (!_.isNil(newDocument)) {
      this.logger.info(`Bill api: About to save file: ${newDocument.name} in db`);
      return this.saveFile(params);
    }
  }

  generateFilePath(interceptorParams) {
    let documentId = new mongoose.Types.ObjectId().toString();
    const {
      lspId,
      bill,
      billId,
      filename,
    } = interceptorParams;
    const duplicatedDocument = bill.documents.find((d) => d.name === filename);

    if (!_.isNil(duplicatedDocument)) {
      documentId = duplicatedDocument._id.toString();
    }
    const fileStorageFacade = new FileStorageFacade(lspId, this.configuration, this.logger);
    const file = fileStorageFacade.billFile(billId, filename);
    return { documentId, filePath: file.path };
  }

  async deleteDocument(billId, documentId) {
    const bill = await this.billAPI.findOne(billId);
    const canUpdateFiles = this._canUpdateFiles(bill.vendor._id);

    if (!canUpdateFiles) {
      throw new RestError(403, { message: 'User is not authorized' });
    }
    const document = _.find(bill.documents, (d) => _.toString(d._id) === _.toString(documentId));
    let updatedBill;

    try {
      const query = { _id: new ObjectId(bill._id), 'documents._id': new ObjectId(documentId) };
      const update = { $set: { 'documents.$.deleted': true, 'documents.$.deletedAt': moment().utc(), 'documents.$.deletedBy': this.user.email } };
      const options = { new: true, multi: false };

      updatedBill = await mongooseSchema.Bill.findOneAndUpdate(query, update, options);
      this.logger.debug(`Removing file with path "${document.cloudKey}" from GCS and AWS`);
      this.cloudStorage.deleteFile(document.cloudKey).catch((err) => {
        const message = _.get(err, 'message', err);

        this.logger.error(`Failed to delete file with id: ${documentId} from Cloud: Err ${message}`);
      });
    } catch (err) {
      this.logger.debug(`Error deleting document "${billId}" ${err}`);
      throw new RestError(400, { message: err.message });
    }
    return updatedBill;
  }

  _canUpdateFiles(vendorId) {
    const isOwner = areObjectIdsEqual(this.user._id, vendorId);
    const userRoles = getRoles(this.user);
    const canUpdateAll = hasRole('BILL_UPDATE_ALL', userRoles);
    return canUpdateAll || isOwner;
  }
}

module.exports = BillDocumentApi;
