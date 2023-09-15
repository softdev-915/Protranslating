const VersionableDocument = require('./versionable-document');

class ActivityVersionableDocument extends VersionableDocument {
  /**
   * Builds an array of UserVersionableDocument from an array of arrays of objects.
   * @param {Array} documents an array of array of objects.
   * @returns {Array} array of VersionableDocument.
   */
  static buildFromArray(documents) {
    return documents.map(arr => new ActivityVersionableDocument(arr));
  }

  get fileType() {
    return this._last.fileType;
  }

  get uploadDate() {
    return this._last.createdAt;
  }
}

module.exports = ActivityVersionableDocument;
