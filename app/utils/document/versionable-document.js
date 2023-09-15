/**
 * VersionableDocument handles an array of document versions.
 * @constructor
 */
class VersionableDocument {
  constructor(documentArray) {
    const len = documentArray.length;
    if (!Array.isArray(documentArray) || len === 0) {
      throw new Error('Expected an array of documents');
    }
    this._versions = documentArray;
    this._last = documentArray[len - 1];
  }

  /**
   * Builds an array of VersionableDocument from an array of arrays of objects.
   * @param {Array} documents an array of array of objects.
   * @returns {Array} array of VersionableDocument.
   */
  static buildFromArray(documents) {
    return documents.map(arr => new VersionableDocument(arr));
  }

  /**
   * getAllVersions returns an array of ObjectIds that stand for every
   * @return {array} an array of ObjectIds.
   */
  getAllVersions() {
    return this._versions;
  }

  /**
   * Retrieves a particular version of the document.
   * @param {String} version is the _id of the file to search for.
   * @returns {Object} returns the full document object with an specific version,
   * if it doesn't exist it will return null.
   */
  getVersion(version) {
    return this._versions.find(v => (v._id ? v._id.toString() === version.toString() : false));
  }

  push(newDocument) {
    this._versions.push(newDocument);
    this._last = newDocument;
  }

  splice(index, howMany) {
    const len = this._versions.length;
    if (len <= 1) {
      throw new Error('Cannot remove last version, delete the whole file instead');
    }
    const removed = this._versions.splice(index, howMany);
    this._last = this._versions[len - 1];
    return removed;
  }

  getLatest() {
    return this._last;
  }

  /* dynamic read only properties that shows the latest version properties */
  get _id() {
    return this._last._id;
  }

  get name() {
    return this._last.name;
  }

  get size() {
    return this._last.size;
  }

  get mime() {
    return this._last.mime;
  }

  get encoding() {
    return this._last.encoding;
  }

  get version() {
    return this._last._id;
  }

  get timestamp() {
    const timestamp = this.version.substring(0, 8);
    const hexa = parseInt(timestamp, 16);
    return new Date(hexa * 1000);
  }

  get type() {
    return this._last.fileType;
  }
}

module.exports = VersionableDocument;
