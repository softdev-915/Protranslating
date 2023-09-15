const path = require('path');
const SchemaAwareAPI = require('../../../schema-aware-api');
const apiResponse = require('../../../../components/api-response');
const fileUtils = require('../../../../utils/file');
const FileStorageFactory = require('../../../../components/file-storage');

const { RestError } = apiResponse;
const ALLOWED_FILE_TYPES = [
  'Agreement/Disclosure',
  'CV/Resume/Certification',
  'Technical Evaluation',
  'Tax Form',
  'Audit/Escalation Form',
  'Change of Information',
  'Other',
];
const isValidFileType = (fileType) => ALLOWED_FILE_TYPES.find((f) => f === fileType);

class UserDocumentProspectAPI extends SchemaAwareAPI {
  constructor(user, configuration, logger) {
    super(logger, { user });
    this.configuration = configuration;
    this.FileStorageFactory = FileStorageFactory;
  }

  async createDocument(user, userIdToEdit, fileType, file) {
    const fileStorageFactory = new this.FileStorageFactory(
      this.lspId.toString(),
      this.configuration,

      this.logger,
    );

    if (!isValidFileType(fileType)) {
      throw new RestError(400, { message: `File type ${fileType} is not valid.` });
    }
    const documentProspect = new this.schema.UserDocumentProspect({
      lspId: this.lspId,
      name: file.originalname,
      mime: file.mimetype,
      encoding: file.encoding,
      size: file.size,
      fileType,
      userId: userIdToEdit,
    });
    const fileStored = await documentProspect.save();
    let extension = fileUtils.getExtension(fileStored.name);

    if (extension.length) {
      extension = `${extension}`;
    }
    const fileStorage = fileStorageFactory
      .userHiringDocumentProspect(userIdToEdit, documentProspect, extension);

    await fileStorage.save(file.buffer);

    return fileStored;
  }

  async deleteDocument(user, userIdToEdit, documentId) {
    const fileStorageFactory = new this.FileStorageFactory(
      this.lspId.toString(),
      this.configuration,

      this.logger,
    );
    const document = await this.schema.UserDocumentProspect.findOne({
      _id: documentId,
      userId: userIdToEdit,
      lspId: this.lspId,
    });

    if (!document) {
      throw new RestError(404, { message: `Document ${documentId} does not exist` });
    }
    if (document.createdBy !== user.email) {
      throw new RestError(403, { message: `Forbidden: Document ${documentId} was not uploaded by the user` });
    }
    const extension = path.extname(document.name);

    try {
      await fileStorageFactory
        .userHiringDocumentProspect(userIdToEdit, document, extension).delete();
    } catch (e) {
      this.logger.error(`Error deleting document file ${document.name} with id ${documentId}. Error: ${e.message}`);
      throw new RestError(500, { message: `Error deleting file for document ${documentId}` });
    }
    try {
      await document.delete();
    } catch (e) {
      this.logger.error(`Mongo Error deleting DocumentProspect with id ${documentId}. Error: ${e.message}`);
      throw new RestError(500, { message: `Error deleting file for document ${documentId}` });
    }

    return document;
  }
}

module.exports = UserDocumentProspectAPI;
