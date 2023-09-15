const _ = require('lodash');
const FilePathFactory = require('./file-path-factory');
const FileStorage = require('./file-storage');

/**
 * VersionableFileStorageFacade is the facade of all the versionable files storage.
 * You MUST use this class when handling versionable documents,
 * DO NOT use FileStorageFacade directly
 */
class VersionableFileStorageFacade {
  constructor(lspId, configuration, logger) {
    this.filePathFactory = new FilePathFactory(lspId, configuration, logger);
    this.FileStorage = FileStorage;
    this.logger = logger;
  }

  /**
   * userDocuments returns a File Storage for a single user document
   * @param {String | Object} userId the request id or object.
   * @param {Object} versionableDocument the versionable document object.
   * @param {String | ObjectId} version the document version.
   * @return {Object} FileStorage object.
   */
  userHiringDocument(userId, versionableDocument, extension, version) {
    const document = versionableDocument.getVersion(version);
    if (!document) {
      throw new Error('Version does not exist');
    }
    const userDocumentPath = this.filePathFactory
      .userHiringDocument(userId, document, extension, version);
    return new this.FileStorage(userDocumentPath, this.logger);
  }

  /**
   * activityFeedbackDocument returns a File Storage for a single activity document
   * @param {Object} versionableDocument the versionable document object.
   * @param {String | ObjectId} version the document version.
   * @return {Object} FileStorage object.
   */
  activityFeedbackDocument(versionableDocument, version) {
    const document = versionableDocument.getVersion(version);
    if (!document) {
      throw new Error('Version does not exist');
    }
    const activityDocumentPath = this.filePathFactory
      .activityFeedbackDocument(_.toString(document._id), document.name);
    return new this.FileStorage(activityDocumentPath, this.logger);
  }
  /**
   * nonRenamedActivityFeedbackDocument returns a File Storage for a single activity document
   * @param {String | ObjectId} activityId the activity ID.
   * @param {Object} versionableDocument the versionable document object.
   * @param {String} extension the extension of the file.
   * @param {String | ObjectId} version the document version.
   * @return {Object} FileStorage object.
   */
  nonRenamedActivityFeedbackDocument(activityId, versionableDocument, extension, version) {
    const document = versionableDocument.getVersion(version);
    if (!document) {
      throw new Error('Version does not exist');
    }
    const activityDocumentPath = this.filePathFactory
      .nonRenamedActivityFeedbackDocument(activityId, document, extension, version);
    return new this.FileStorage(activityDocumentPath, this.logger);
  }
}

module.exports = VersionableFileStorageFacade;
