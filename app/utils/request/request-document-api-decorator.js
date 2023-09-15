const path = require('path');
const _ = require('lodash');
const { RestError, sendResponse } = require('../../components/api-response');
const { sanitizeFilename, isValidGcsFilename } = require('../../components/cloud-storage/cloud-storage-helpers');

const MOCKED_FILE_DOWNLOAD_MD5HASH = 'textfile_01_md5_hash.txt';
const DEFAULT_HASH_FOR_OLD_FILES = 'default';
class RequestDocumentApiDecorator {
  /**
   * @param {Object} api Api to wrap
   * @param {Object} req Http Request
   * @param {Object} res Http Response
   * @param {Object} options
   */
  constructor({ api, cloudStorage, req, res }) {
    this.api = api;
    this.req = req;
    this.res = res;
    this.cloudStorage = cloudStorage;
    this.mock = req.flags.mock;
  }
  async sendFile(downloadFilePath) {
    this.req.$logger.info(`Sending file ${downloadFilePath}`);
    const url = await this.cloudStorage.gcsGetFileDownloadUrl(downloadFilePath);
    return sendResponse(this.res, 200, url);
  }

  getNonRenamedFilePath(document, fileParams) {
    Object.assign(fileParams, {
      requestId: fileParams.request,
    });
    const extension = path.extname(document.name);
    const documentId = _.get(document, '_id').toString();
    fileParams.document = {
      taskId: document.taskId,
      final: document.final,
      documentId,
      name: `${documentId.toString()}${extension}`,
    };
    return this.api.buildFilePath(fileParams);
  }

  async serveFile(fileParams) {
    const { document, file } = await this.api.findDocument(fileParams);
    const filePathWithName = file.path;
    const documentCloudKey = _.get(document, 'cloudKey', filePathWithName);
    let { md5Hash } = document;
    let isFileRenamed = false;
    if (this.mock && document.name === MOCKED_FILE_DOWNLOAD_MD5HASH) {
      md5Hash = '94a45641-d14d-49fa-a3f1-f823cf8e814a';
    }
    try {
      await this.cloudStorage.gcsGetFile(documentCloudKey)
        .then(async (cloudFile) => {
          const isGzipEncoded = _.get(cloudFile, 'metadata.contentEncoding', '') === 'gzip';
          if (md5Hash !== cloudFile.metadata.md5Hash &&
              md5Hash !== DEFAULT_HASH_FOR_OLD_FILES &&
              !_.isEmpty(md5Hash) &&
              !isGzipEncoded) {
            throw new Error(`We have detected an integrity issue with the file from: ${documentCloudKey} We were expecting the file hash to be: ${md5Hash} but the hash of the file in the remote storage is ${cloudFile.metadata.md5Hash}.`);
          }
          const cloudKey = _.get(document, 'cloudKey', '');
          const fileName = path.basename(documentCloudKey);
          if (cloudKey.indexOf(fileName) < 0 || _.isEmpty(cloudKey)) {
            Object.assign(fileParams, {
              md5Hash,
              newCloudKey: cloudFile.name,
            });
            this.api.updateDocument(fileParams);
          }
          return this.sendFile(cloudFile.name);
        }).catch(async (err) => {
          if (_.isNil(err.message.match('integrity'))) {
            const extension = path.extname(document.name);
            const { path: filePathWithId } = this.getNonRenamedFilePath(document, fileParams);
            this.req.$logger.error(`Failed to find document in GCS: ${err}`);
            Object.assign(fileParams, {
              cloudKey: filePathWithId,
              document: {
                name: `${_.get(document, '_id').toString()}${extension}`,
              },
            });
            isFileRenamed = true;
            return this.renameFile(fileParams);
          }
          throw err;
        });
    } catch (err) {
      if (_.isNil(err.message.match('integrity')) && !isFileRenamed) {
        const extension = path.extname(document.name);
        const { path: filePathWithId } = this.getNonRenamedFilePath(document, fileParams);
        this.req.$logger.error(`Failed to find document in GCS: ${err}`);
        Object.assign(fileParams, {
          cloudKey: filePathWithId,
          document: {
            name: `${_.get(document, '_id').toString()}${extension}`,
          },
        });
        return this.renameFile(fileParams);
      }
      throw err;
    }
  }

  async renameFile(fileParams) {
    const oldCloudKey = fileParams.cloudKey;
    if (_.isEmpty(oldCloudKey)) {
      this.req.$logger.error('Failed to generate file remote cloud key');
      throw new RestError(500, { message: 'The file could not be downloaded because the remote url is missing' });
    }
    const { document } = await this.api.findDocument(fileParams);
    const filePrefixRegex = this.api.getFilePrefixRegex(document);
    const sanitizedFilename = sanitizeFilename(document.name);
    if (!isValidGcsFilename(sanitizedFilename)) {
      this.req.$logger.error(`The file can not be uploaded because the name. Original name: ${document.name} new filename: ${sanitizedFilename}`);
      throw new RestError(500, { message: `The file can not be uploaded because the name: ${sanitizedFilename} is not valid` });
    }
    await this.cloudStorage.gcsGetFile(oldCloudKey)
      .then(async (oldCloudFile) => {
        const newCloudKey = oldCloudFile.name.replace(document._id.toString(), sanitizedFilename);
        Object.assign(fileParams, {
          newCloudKey,
          filename: sanitizedFilename,
        });
        await this.cloudStorage.gcsMoveFile(oldCloudKey, newCloudKey, filePrefixRegex);
        await this.cloudStorage.gcsGetFile(newCloudKey).then(async (newCloudFile) => {
          const { md5Hash } = newCloudFile.metadata;
          Object.assign({
            md5Hash,
            newCloudKey: newCloudFile.name,
          });
          await this.api.updateDocument(fileParams);
          return this.sendFile(newCloudFile.name);
        });
      })
      .catch((err) => {
        this.req.$logger.error(`Failed to find document in GCS: ${err}`);
        throw new RestError(404, { message: `${err}. The file does not exist`, stack: err.stack });
      });
  }
}

module.exports = RequestDocumentApiDecorator;
