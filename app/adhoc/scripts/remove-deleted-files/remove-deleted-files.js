const Promise = require('bluebird');
const FileStorageFacade = require('../../../components/file-storage');
const nullLogger = require('../../../components/log/null-logger');

class RemoveDeletedFiles {
  constructor(logger, configuration, schema) {
    this.schema = schema;
    this.logger = logger;
    this.configuration = configuration;
  }

  _processRequest(request) {
    if (request && request.documents && Array.isArray(request.documents)) {
      const companyId = request.company.toString();
      const requestId = request._id.toString();
      const lspId = request.lspId.toString();
      const fileStorageFacade = new FileStorageFacade(lspId, this.configuration, nullLogger);
      const deletedDocuments = request.documents.filter(d => d.toJSON().deleted);
      if (deletedDocuments.length) {
        return Promise.map(deletedDocuments, (doc) => {
          if (doc.name) {
            this.logger.info(`Checking file for company ${companyId}, request ${requestId} and doc ${doc}`);
            let fileStorage = fileStorageFacade.translationRequestFile(companyId, requestId, doc);
            if (doc.final) {
              fileStorage = fileStorageFacade
                .translationRequestFinalFile(companyId, requestId, doc);
            }
            return fileStorage.exists().then((exists) => {
              if (exists) {
                return fileStorage.delete();
              }
            });
          }
        });
      }
    }
  }

  removeDeletedFiles() {
    const cursor = this.schema.Request.find({
      'documents.deleted': true,
    }).cursor();
    return cursor.eachAsync(request => this._processRequest(request));
  }
}

module.exports = RemoveDeletedFiles;
