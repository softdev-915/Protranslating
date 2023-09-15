const _ = require('lodash');
const axios = require('axios');
const path = require('path');
const Promise = require('bluebird');
const moment = require('moment');
const FilePathFactory = require('../../../../../../components/file-storage/file-path-factory');
const configuration = require('../../../../../../components/configuration');
const CloudStorage = require('../../../../../../components/cloud-storage');
const { isValidURL, isGDriveUrl, getDownloadableGDriveURL } = require('../../../../../../utils/url');
const fs = require('fs');

const getFileStat = Promise.promisify(fs.stat);

class AbstractFileImporter {
  constructor(user, schema) {
    this.user = user;
    this.schema = schema;
    this.filePathFactory = new FilePathFactory(user.lsp._id, configuration);
    this.gcsBucket = new CloudStorage(configuration).gcsBucket;
  }

  // eslint-disable-next-line no-unused-vars
  async getFileDataByUrl(fileUrl) {
    throw new Error('Method "getFileDataByUrl" must be implemented');
  }

  async getLocalFileData() {
    throw new Error('Method "getLocalFileData" must be implemented');
  }

  async afterSaveHook() {
    return true;
  }

  async onFailHook() {
    return true;
  }

  _getFilenameFromResponse(response) {
    return _.get(response, 'headers.content-disposition', ';=')
      .split(';')[1]
      .split('=')[1]
      .replace(/"/g, '');
  }

  async _documentProspectUploadAndGetData(fileUrl) {
    if (!isValidURL(fileUrl)) {
      return {};
    }
    if (isGDriveUrl(fileUrl)) {
      fileUrl = getDownloadableGDriveURL(fileUrl);
    }
    const response = await axios({ method: 'get', url: fileUrl, responseType: 'stream' });
    const fileName = this._getFilenameFromResponse(response) || path.basename(fileUrl);
    return await this._writeToUploadStream(response.data, {
      name: fileName,
      size: response.headers['content-length'],
      type: response.headers['content-type'],
      encoding: response.headers['Content-Transfer-Encoding'],
    });
  }

  async uploadLocalDocument(filePath) {
    const fileName = path.basename(filePath);
    const readStream = fs.createReadStream(filePath);
    const fileState = await getFileStat(filePath);
    return await this._writeToUploadStream(readStream, {
      name: fileName,
      size: fileState.size,
      type: 'text/html; charset=utf-8',
    });
  }

  async _writeToUploadStream(readStream, file) {
    const fileName = _.get(file, 'name');
    const fileSize = _.get(file, 'size');
    const fileType = _.get(file, 'type');
    const fileEncoding = _.get(file, 'encoding', '7bit');
    const prospectDoc = await new this.schema.DocumentProspect();
    const prospectDocId = prospectDoc._id.toString();
    const extension = path.extname(fileName);
    const destination = this.filePathFactory.documentProspectFile(prospectDocId, extension);
    const writeStream = this.gcsBucket.file(destination).createWriteStream();
    return new Promise((resolve, reject) => {
      readStream.pipe(writeStream);
      let error = null;
      writeStream.on('error', (err) => {
        error = err;
        writeStream.end();
        reject(err);
      });
      writeStream.on('finish', () => {
        if (_.isEmpty(error)) {
          const now = moment().utc().toString();
          resolve({
            _id: prospectDocId,
            size: fileSize,
            mime: fileType,
            name: fileName,
            encoding: fileEncoding,
            cloudKey: destination,
            createdAt: now,
            updatedAt: now,
          });
        }
      });
    });
  }

  async _deleteGcsFile(filepath) {
    if (_.isEmpty(filepath)) {
      return;
    }
    const file = this.gcsBucket.file(filepath);
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
    }
  }
}

module.exports = AbstractFileImporter;
