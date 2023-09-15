const _ = require('lodash');
const FilePathFactory = require('../../components/file-storage/file-path-factory');
const { RestError } = require('../../components/api-response');
const { areObjectIdsEqual } = require('../schema');

function generateFilePath({ entityName, entityId }, { filename }) {
  const filePathFactory = new FilePathFactory(this.lspId, this.configuration, this.logger);
  const folderName = `${_.camelCase(entityName)}Files`;
  const filePath = filePathFactory.getFilePath(folderName, entityId, filename);
  return filePath;
}

async function handleFileUpload(entityId, fileUploadInfo) {
  const entity = await this.entitySchema.findOne({ _id: entityId });
  const attachments = _.get(entity, 'attachments', []);
  entity.attachments = _.unionBy([fileUploadInfo], attachments, 'name');
  await entity.save();
  return { attachments: entity.attachments };
}

async function detach(entityId, attachmentId) {
  const entity = await this.entitySchema.findOne({ _id: entityId });
  if (_.isNil(entity)) {
    throw new RestError(500, { message: `Entity with id: ${entityId} was not found` });
  }
  const attachments = _.get(entity, 'attachments', []);
  const attachmentToDelete =
    attachments.find(attachment => areObjectIdsEqual(attachment._id, attachmentId));
  await this.cloudStorage.deleteFile(attachmentToDelete.cloudKey);
  entity.attachments = _.differenceBy(attachments, [attachmentToDelete], '_id');
  await entity.save();
}

async function getFileStream(entityId, attachmentId) {
  const entity = await this.entitySchema.findOne({ _id: entityId });
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

const assignAttachmentManagementMethods = (api, schema) => {
  api.entitySchema = schema;
  api.generateFilePath = generateFilePath;
  api.handleFileUpload = handleFileUpload;
  api.detach = detach;
  api.getFileStream = getFileStream;
};

module.exports = assignAttachmentManagementMethods;
