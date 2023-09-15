const _ = require('lodash');
const path = require('path');
const Promise = require('bluebird');
const AbstractFileImporter = require('./abstract-file-importer');

class OpportunityFileImporter extends AbstractFileImporter {
  async getFileDataByUrl(fileUrl) {
    return await this._documentProspectUploadAndGetData(fileUrl);
  }

  async getLocalFileData() {
    const filePath = path.resolve(__dirname, '../../../../../../test/textfile.txt');
    return await this.uploadLocalDocument(filePath);
  }

  async afterSaveHook(entity) {
    await Promise.map(_.get(entity, 'documents', []), async (doc) => {
      const newFileKey = this.filePathFactory.opportunityFile(this.entity.company, entity._id, doc);
      await this.gcsBucket.file(doc.cloudKey).move(newFileKey);
      doc.cloudKey = newFileKey;
    });
  }

  async onFailHook(entity) {
    await Promise.map(_.get(entity, 'documents', []), ({ cloudKey }) =>
      this._deleteGcsFile(cloudKey),
    );
  }
}

module.exports = OpportunityFileImporter;
