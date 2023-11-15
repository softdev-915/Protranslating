import _ from 'lodash';
import VersionableDocument from './versionable-document';

export default class ActivityVersionableDocument extends VersionableDocument {
  /**
   * Builds an array of ActivityVersionableDocument from an array of arrays of objects.
   * @param {Array} documents an array of array of objects.
   * @returns {Array} array of VersionableDocument.
   */
  constructor(documentArray) {
    super(documentArray);
    this.isSelected = false;
  }

  static buildFromArray(documents) {
    return documents.map((arr) => new ActivityVersionableDocument(arr));
  }

  static activeDocuments(documents) {
    const documentsFiltered = [];
    _.forEach(documents, (doc) => {
      const versions = doc.filter((version) => !version.deleted);
      if (versions.length > 0) {
        documentsFiltered.push(versions);
      }
    });
    return ActivityVersionableDocument.buildFromArray(documentsFiltered);
  }

  get fileType() {
    return this._last.fileType;
  }

  get uploadDate() {
    return this._last.createdAt;
  }
}
