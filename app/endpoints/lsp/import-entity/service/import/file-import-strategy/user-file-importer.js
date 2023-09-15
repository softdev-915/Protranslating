const path = require('path');
const _ = require('lodash');
const Promise = require('bluebird');
const AbstractFileImporter = require('./abstract-file-importer');

class UserFileImporter extends AbstractFileImporter {
  async getFileDataByUrl(fileUrl) {
    return await this._documentProspectUploadAndGetData(fileUrl);
  }

  async getLocalFileData() {
    const filePath = path.resolve(__dirname, '../../../../../../test/textfile.txt');
    return await this.uploadLocalDocument(filePath);
  }

  _getEntityDocuments(entity) {
    return _.get(entity, `${_.get(entity, 'type', '').toLowerCase()}Details.hiringDocuments`, [])
      .map(item => (Array.isArray(item) ? item[0] : item));
  }

  async afterSaveHook(entity) {
    await Promise.map(this._getEntityDocuments(entity), async (doc) => {
      const newFileKey = this.filePathFactory.userHiringDocument(
        entity._id.toString(), doc, null, doc._id,
      );
      await this.gcsBucket.file(doc.cloudKey).move(newFileKey);
      doc.cloudKey = newFileKey;
    });
  }

  async onFailHook(entity) {
    await Promise.map(this._getEntityDocuments(entity), ({ cloudKey }) =>
      this._deleteGcsFile(cloudKey),
    );
  }
}

module.exports = UserFileImporter;
