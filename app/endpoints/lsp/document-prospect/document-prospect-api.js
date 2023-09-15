const mongoose = require('mongoose');
const _ = require('lodash');
const Promise = require('bluebird');
const path = require('path');
const FileStorageFactory = require('../../../components/file-storage');
const SchemaAwareAPI = require('../../schema-aware-api');
const apiResponse = require('../../../components/api-response');
const fileUtils = require('../../../utils/file');
const CloudStorage = require('../../../components/cloud-storage');
const { ipComplies } = require('../../../utils/security');

const { RestError } = apiResponse;
const { Types: { ObjectId }, isValidObjectId } = mongoose;

class DocumentProspectAPI extends SchemaAwareAPI {
  constructor(user, configuration, logger, clientIP) {
    super(logger, { user });
    this.configuration = configuration;
    this.clientIP = clientIP;
    this.FileStorageFactory = FileStorageFactory;
  }

  async performCIDRCheck(companyId) {
    // check ObjectId valid
    if (!isValidObjectId(companyId)) {
      this.logger.error(`Invaid company id provided during document-prospect upload: ${companyId}`);
      throw new RestError(403, { message: `Invaid company id provided during document-prospect upload: ${companyId}` });
    }
    // get the company
    // Note: findOneWithDeleted instead of findOne just in case the company was removed
    const company = await this.schema.Company.findOneWithDeleted({
      _id: companyId,
      lspId: this.lspId,
    });

    if (!company) {
      this.logger.error(`Unable to find company with ObjectID ${companyId}`);
      throw new RestError(403, { message: `Unable to find company with ObjectID ${companyId}` });
    }
    // get cidr
    const cidr = _.get(company, 'cidr', []);

    if (cidr.length > 0) {
      const rules = cidr.map((c) => c.subnet);

      if (!ipComplies(this.clientIP, rules)) {
        this.logger.error(`IP ${this.clientIP} is not allowed to upload files`);
        const message = `Your IP "${this.clientIP}" is not allowed to upload files for this company`;

        throw new RestError(403, {
          message,
          stack: message,
        });
      }
    }
  }

  async createProspects(user, files) {
    const fileStorageFactory = new this.FileStorageFactory(
      this.lspId.toString(),
      this.configuration,

      this.logger,
    );
    const documentProspects = files.map((f) => new this.schema.DocumentProspect({
      lspId: this.lspId,
      user: this.user._id,
      ip: this.clientIP,
      name: f.originalname,
      mime: f.mimetype,
      encoding: f.encoding,
      size: f.size,
      createdBy: user.email,
    }));
    const filesStored = await Promise.all(documentProspects.map((d) => d.save()));
    const fileSavePromises = [];

    filesStored.forEach((f, index) => {
      const prospectId = f._id.toString();
      let extension = fileUtils.getExtension(f.name);

      if (extension.length) {
        extension = `${extension}`;
      }
      const fileStorage = fileStorageFactory.documentProspectFile(prospectId, extension, true);
      const fileSave = fileStorage.save(files[index].buffer);

      fileSavePromises.push(fileSave);
    });
    await new Promise((resolve, reject) => {
      Promise.all(fileSavePromises).then(resolve).catch(reject);
    });
    return filesStored;
  }

  async getDocumentProspect(id) {
    const document = await this.schema.DocumentProspect.findOne({
      _id: new ObjectId(id),
    });

    if (_.isNil(document)) {
      throw new RestError(404, { message: `Document ${id} does not exist` });
    }
    return document;
  }

  async deleteProspectDocument(user, documentProspectId) {
    const document = await this.schema.DocumentProspect.findOne({
      _id: documentProspectId,
      lspId: this.lspId,
    });

    if (!document) {
      throw new RestError(404, { message: `Document ${documentProspectId} does not exist` });
    }
    if (document.createdBy !== user.email) {
      throw new RestError(401, { message: `Forbidden: Document ${documentProspectId} was not uploaded by the user` });
    }
    let cloudKey = _.get(document, 'cloudKey', false);

    if (!cloudKey) {
      const extension = path.extname(document.name);

      cloudKey = `${document.lspId}/prospect_documents/${document._id}.${extension}`;
    }
    const cloudStorage = new CloudStorage(this.configuration, this.logger);

    try {
      await cloudStorage.wipeOutBucketFiles(cloudKey, true);
      // await fileStorageFactory
      // .documentProspectFile(documentProspectId, extension).delete();
    } catch (e) {
      this.logger.error(`Error deleting document file ${document.name} with id ${documentProspectId}. Error: ${e.message}`);
      throw new RestError(500, { message: `Error deleting file for document ${documentProspectId}` });
    }
    try {
      await document.delete();
    } catch (e) {
      this.logger.error(`Mongo Error deleting DocumentProspect with id ${documentProspectId}. Error: ${e.message}`);
      throw new RestError(500, { message: `Error deleting file for document ${documentProspectId}` });
    }
    return document;
  }
}

module.exports = DocumentProspectAPI;
