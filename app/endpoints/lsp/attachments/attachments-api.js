const _ = require('lodash');
const SchemasAwareApi = require('../../schema-aware-api');
const CloudStorage = require('../../../components/cloud-storage');
const FilePathFactory = require('../../../components/file-storage/file-path-factory');
const { areObjectIdsEqual } = require('../../../utils/schema');
const { RestError } = require('../../../components/api-response');

class AttachmentsApi extends SchemasAwareApi {
  constructor(logger, options) {
    super(logger, Object.assign({}, options, { enableTransactions: true }));
    this.configuration = _.get(options, 'configuration');
    this.cloudStorage = new CloudStorage(this.configuration);
  }

  generateFilePath({ entityName, entityId }, { filename }) {
    const filePathFactory = new FilePathFactory(this.lspId, this.configuration, this.logger);
    const folderName = `${_.camelCase(entityName)}Files`;
    return filePathFactory.getFilePath(folderName, entityId, filename);
  }

  async handleFileUpload({ entityName, entityId }, fileUploadInfo) {
    const schemaName = entityName === 'invoice' ? 'ArInvoice' : _.upperFirst(_.camelCase(entityName));
    const entity = await this.schema[schemaName].findOne({ _id: entityId });
    const attachments = _.get(entity, 'attachments', []);
    entity.attachments = _.unionBy([fileUploadInfo], attachments, 'name');
    await entity.save();
    return { attachments: entity.attachments };
  }

  async detach(entityName, entityId, attachmentId) {
    const schemaName = entityName === 'invoice' ? 'ArInvoice' : _.upperFirst(_.camelCase(entityName));
    const entity = await this.schema[schemaName].findOne({ _id: entityId });
    const attachments = _.get(entity, 'attachments', []);
    const attachmentToDelete =
      attachments.find(attachment => areObjectIdsEqual(attachment._id, attachmentId));
    await this.cloudStorage.deleteFile(attachmentToDelete.cloudKey);
    entity.attachments = _.differenceBy(attachments, [attachmentToDelete], '_id');
    await entity.save();
    return entity.attachments;
  }

  async getFileStream(entityName, entityId, attachmentId) {
    const schemaName = entityName === 'invoice' ? 'ArInvoice' : _.upperFirst(_.camelCase(entityName));
    const entity = await this.schema[schemaName].findOne({ _id: entityId });
    const attachments = _.get(entity, 'attachments', []);
    const attachment = attachments.find(a => areObjectIdsEqual(a._id, attachmentId));
    if (_.isNil(attachment)) {
      throw new RestError(404, { message: `Attachment ${attachmentId} not found` });
    }
    const cloudFile = await this.cloudStorage.gcsGetFile(attachment.cloudKey);
    return {
      fileReadStream: cloudFile.createReadStream(),
      filename: attachment.name,
    };
  }
}

module.exports = AttachmentsApi;
