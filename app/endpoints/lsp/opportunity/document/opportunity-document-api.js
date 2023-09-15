const { Types: { ObjectId } } = global.mongoose || require('mongoose');
const _ = require('lodash');
const AbstractRequestAPI = require('../../request/abstract-request-api');
const FileStorageFactory = require('../../../../components/file-storage/file-storage');
const { RestError } = require('../../../../components/api-response');
const { areObjectIdsEqual } = require('../../../../utils/schema');
const { checkSalesRepBelongsToCompany } = require('../opportunity-helper');

const srcFilesList = (opportunity, fileStorageFacade) => {
  const nonDeletedFiles = opportunity.documents.filter((d) => !d.toJSON().deleted);
  if (!nonDeletedFiles.length) {
    this.logger.info(`Opportunity ${opportunity._id} has no files`);
    throw new RestError(409, { message: 'No documents available to download' });
  }
  return nonDeletedFiles.map((f) => {
    const file = fileStorageFacade.opportunityFile(opportunity.company, opportunity, f, true);
    file.name = f.name;
    return file;
  });
};

class OpportunityDocumentAPI extends AbstractRequestAPI {
  constructor(options) {
    super(options);
    this.FileStorageFactory = FileStorageFactory;
    this.bucket = options.bucket;
  }

  async buildFilePath(companyId, opportunityId, documentId) {
    const fileStorageFacade = new this.FileStorageFacade(
      this.lspId,
      this.configuration,
      this.logger,
    );
    const opportunity = await this.schema.Opportunity.findOne({
      _id: new ObjectId(opportunityId),
      lspId: this.lspId,
    }, 'documents company');
    const document = opportunity.documents.find((doc) => doc._id.toString() === documentId);
    const company = _.get(opportunity.company, '_id', opportunity.company._id);
    if (companyId !== company.toString()) {
      this.logger.debug(`Opportunity ${opportunityId} company ${companyId} doesnt match opportunity company ${company}`);
      throw new RestError(404, { message: 'You are not allow to download this file' });
    }
    const params = [companyId, opportunityId, document, true];
    if (!document) {
      this.logger.debug(`The document ${documentId} does not exist`);
      throw new RestError(404, { message: `The document ${documentId} does not exist` });
    }
    const file = fileStorageFacade.opportunityFile(...params);
    return {
      name: document.name,
      path: file.path,
    };
  }

  async checkFileRemovalPermissions(id) {
    this.logger.debug(`Checking if sales rep user ${this.user._id.toString()} can delete documents for opportunity: ${id}`);
    const opportunity = await this.schema.Opportunity._findOne({ _id: id, lspId: this.lspId }, 'company');
    try {
      this.logger.debug(`Checking if sales rep user ${this.user._id.toString()} belongs to company ${opportunity.company}`);
      const belongs = await checkSalesRepBelongsToCompany(
        this.user,
        this.lspId,
        opportunity,
      );
      if (!belongs) {
        throw new RestError(403, { message: 'Error saving opportunity.You are not allowed to save opportunities for this company' });
      }
      return true;
    } catch (err) {
      throw new RestError(403, { message: 'You are not allowed to delete documents for this opportunity' });
    }
  }

  async zipFilesStream(companyId, id, res) {
    const opportunity = await this.schema.Opportunity.findOne({ _id: id, lspId: this.lspId }, 'no company documents');
    if (_.isNil(opportunity) || !areObjectIdsEqual(opportunity.company, companyId)) {
      this.logger.info(`No oportunity with id ${id} and company ${companyId}`);
      throw new RestError(404, { message: `Opportunity ${id} with company ${companyId} does not exist` });
    }
    const fileStorageFacade = new this.FileStorageFacade(
      this.lspId,
      this.configuration,
      this.logger,
    );
    const files = srcFilesList(opportunity, fileStorageFacade);
    try {
      await this.cloudStorage.streamZipFile({ res, files, zipFileName: `${opportunity.no}.zip` });
    } catch (err) {
      const message = _.get(err, 'message', err);
      this.logger.error(`Error writing zip file. Error: ${message}`);
      throw new RestError(500, { message: 'Error generating zip file', stack: err.stack });
    }
  }
}

module.exports = OpportunityDocumentAPI;
