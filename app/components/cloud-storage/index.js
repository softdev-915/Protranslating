const moment = require('moment');
const Promise = require('bluebird');
const _ = require('lodash');
const Archiver = require('archiver');
const { fileContentDisposition } = require('../../components/api-response');
const AWSBucket = require('../../components/aws/bucket');
const { Storage } = require('@google-cloud/storage');
const defaultLogger = require('../log/logger');
const { isOldCloudProspect } = require('./cloud-storage-helpers');
const CloudStorageEngine = require('./storage-engine');
const { awaitCondition } = require('../../utils/async');

const DEFAULT_HASH_FOR_OLD_FILES = 'default';
const DOCUMENT_PENDING_STATE = 'pending';
const prefixDocProspectRegex = /[a-zA-Z0-9]{24}\/prospect_documents\/[a-zA-Z0-9]{24,}/;
const SIGNED_URL_EXPIRATION_TIMEOUT = 5;
const ZIP_DOWNLOAD_LIMIT_SIZE = 3221225472;
const CREATE_WRITE_STREAM_OPTIONS = {
  gzip: false,
  timeout: 3600000,
  metadata: {
    contentType: 'application/octet-stream',
  },
};

class CloudStorage {
  constructor(configuration, logger = defaultLogger) {
    const environmentConfig = configuration.environment;

    this.awsBucket = new AWSBucket({
      accessKeyId: environmentConfig.AWS_S3_KEY,
      secretAccessKey: environmentConfig.AWS_S3_SECRET,
      region: 'us-east-1',
      bucketACL: 'private',
      bucketName: environmentConfig.AWS_S3_BUCKET,
      pagingDelay: 5,
    });
    this.logger = logger;
    const gcs = new Storage({
      keyFilename: environmentConfig.GCS_KEY_FILE,
      retryOptions: {
        // If this is false, requests will not retry and the parameters
        // below will not affect retry behavior.
        autoRetry: true,
        // The multiplier by which to increase the delay time between the
        // completion of failed requests, and the initiation of the subsequent
        // retrying request.
        retryDelayMultiplier: 3,
        // The total time between an initial request getting sent and its timeout.
        // After timeout, an error will be returned regardless of any retry attempts
        // made during this time period.
        totalTimeout: 500,
        // The maximum delay time between requests. When this value is reached,
        // retryDelayMultiplier will no longer be used to increase delay time.
        maxRetryDelay: 60,
        // The maximum number of automatic retries attempted before returning
        // the error.
        maxRetries: 15,
      },
    });
    this.gcsBucket = gcs.bucket(environmentConfig.GCS_BUCKET);
    this.S3_START_MULTIPART_COPY_AT_BYTES = environmentConfig.S3_START_MULTIPART_COPY_AT_BYTES;
    this.ARCHIVE_FILES_IN_AWS = environmentConfig.ARCHIVE_FILES_IN_AWS;
    this.cloudStorageEngine = new CloudStorageEngine({
      configuration,
      awsBucket: this.awsBucket,
      gcsBucket: this.gcsBucket,
    });
  }

  /**
   * Delete multiple files from AWS Bucket
   *
   * Note: we are just marking them as deleted the version history will still exist
   * A delete marker will be created for each file after success resolution
   *
   * @param {array} awsFilePaths list of indexes to mark as deleted
   *
   * @return {Promise} bucket promise resolves as object with deletedMarkers
   */
  awsDeleteFiles(awsFilePaths = []) {
    if (!_.isArray(awsFilePaths)) {
      throw new Error(`Expected awsFilePaths to be array and got ${awsFilePaths} instead`);
    }
    this.logger.debug(`AWS Bucket Deleting all markers and version for path Key: ${awsFilePaths}`);

    return this.awsBucket.deleteFiles({ files: awsFilePaths });
  }

  /**
   * Uploads / persists a single file to AWS Bucket
   *
   * Note: we are just marking them as deleted the version history will still exist
   * A delete marker will be created for each file after success resolution
   *
   * @param {string} filePath original file path
   * @param {string} awsFilePath Key bucket destination
   *
   * @return {Promise} bucket promise resolves as object with response and url
   */
  awsUploadFile(filePath, awsFilePath) {
    if (typeof awsFilePath !== 'string') {
      this.logger.debug(`AWS Bucket: wrong aws file key provided, Key: ${awsFilePath}`);
      throw new Error(`AWS Bucket: wrong aws file key provided, Key: ${awsFilePath}`);
    }
    if (typeof awsFilePath !== 'string') {
      this.logger.debug(`AWS Bucket: wrong aws file path provided, Path: ${awsFilePath}`);
      throw new Error(`AWS Bucket: wrong aws file path provided, Path: ${awsFilePath}`);
    }
    this.logger.debug(`AWS Bucket: will upload "${filePath}" to "${awsFilePath}"`);

    return this.awsBucket.uploadFile({ filePath, Key: awsFilePath });
  }

  /**
   * Move a single file to a different destination on AWS Bucket
   *
   * Move is a user level operation that requires 2 steps:
   * 1. copyObject (source -> target)
   * 2. deleteObject (source)
   *
   * Note: copyObject creates a copy of an object that is already stored in Amazon S3
   *
   * @param {string} filePath original file path
   * @param {string} awsFilePath Key bucket destination
   *
   * @return {Promise} bucket promise resolves as object with response and url
   */
  awsMoveFile(filePath, destinationFilePath, prefixRegex, docSize) {
    prefixRegex = prefixRegex || prefixDocProspectRegex;
    if (typeof destinationFilePath !== 'string') {
      this.logger.debug(`AWS Bucket: wrong aws file key provided, Key: ${destinationFilePath}`);
      throw new Error(`AWS Bucket: wrong aws file key provided, Key: ${destinationFilePath}`);
    }
    if (typeof filePath !== 'string') {
      this.logger.debug(`AWS Bucket: wrong aws file original path provided, Path: ${filePath}`);
      throw new Error(`AWS Bucket: wrong aws file original path provided, Path: ${filePath}`);
    }
    if (filePath === destinationFilePath) {
      this.logger.debug(`AWS Bucket: destination path cannot be equal to source path: ${filePath} -> ${destinationFilePath}`);
      throw new Error(`AWS Bucket: destination path cannot be equal to source path: ${filePath} -> ${destinationFilePath}`);
    }
    if (!_.isRegExp(prefixRegex)) {
      this.logger.debug(`AWS Bucket: invalid parameter prefixRegex, regular expression was expected: ${prefixRegex}`);
      throw new Error(`AWS Bucket: invalid parameter prefixRegex, regular expression was expected: ${prefixRegex}`);
    }

    if (!filePath.match(prefixRegex)) {
      this.logger.debug(`Cloud Storage Bucket: move aws file invalid Prefix detected: <${filePath}>`);
      throw new Error(`Cloud Storage Bucket: move file invalid Prefix detected: <${filePath}>`);
    }

    this.logger.debug(`AWS Bucket: will move "${filePath}" to "${destinationFilePath}"`);
    const copyFileParameters = {
      CopySource: filePath,
      Key: destinationFilePath,
    };
    const operations = [
      docSize > this.S3_START_MULTIPART_COPY_AT_BYTES
        ? () => this.awsBucket.copyFileMultipart(copyFileParameters, true, docSize)
        : () => this.awsBucket.copyFile(copyFileParameters, true),
      () => this.awsBucket.deleteAllVersionsAndMarkers({
        // NOTE: warning this Key can be used as a prefix
        Key: filePath,
      }),
    ];

    return Promise.mapSeries(operations, (f) => f()).catch((err) => {
      this.logger.debug(`Cloud Storage Bucket: failed to move using prefix "${filePath}" ${err}`);
      throw err;
    });
  }

  /**
   * Wipes out multiple files with all of its versions and delete markers from AWS Bucket
   *
   * Note: after executing this method there's no way back
   * all of the backup versions and delete markers will be gone
   * for all files which key matches the provided indexes
   * so use it with extreme caution
   *
   * @param {string} awsFilePrefix prefix used to remove
   *
   * @return {Promise} bucket promise resolves as object with empty summary of versions and markers
   */
  awsDeleteAllVersionsAndMarkers(awsFilePrefix) {
    if (typeof awsFilePrefix !== 'string' || awsFilePrefix === '') {
      this.logger.debug(`AWS Bucket: delete all versions and markers invalid Prefix: <${awsFilePrefix}>`);
      throw new Error(`AWS Bucket: delete all versions and markers invalid Prefix: <${awsFilePrefix}>`);
    }
    const prefixRegex = /[a-zA-Z0-9]{24}\/request_files\/[a-zA-Z0-9]{24}\/[a-zA-Z0-9]{24}\//;

    if (!awsFilePrefix.match(prefixRegex)) {
      this.logger.debug(`AWS Bucket: delete all versions and markers invalid Prefix detected: <${awsFilePrefix}>`);
      throw new Error(`AWS Bucket: delete all versions and markers invalid Prefix detected: <${awsFilePrefix}>`);
    }

    return this.awsBucket.deleteAllVersionsAndMarkers({
      // NOTE: warning this Key can be used as a prefix
      Key: awsFilePrefix,
    });
  }

  /**
   * Delete single file from GCS Bucket
   *
   * @param {string} gcsFilePath to be deleted
   *
   * @return {Promise} bucket promise resolves as object with operation results
   */
  gcsDeleteFile(gcsFilePath) {
    if (!_.isString(gcsFilePath) || _.isEmpty(gcsFilePath)) {
      throw new Error(`Expected gcsFilePath to be non empty string and got ${gcsFilePath} instead`);
    }
    this.logger.debug(`GCS Bucket Deleting file from path Key: ${gcsFilePath}`);

    return this.gcsBucket.file(gcsFilePath).delete();
  }

  /**
   * Uploads a single file to GCS Bucket
   *
   * @param {string} filePath original file path
   * @param {string} gcsFilePath Key bucket destination
   *
   * @return {Promise} bucket promise resolves as object with operation results
   */
  gcsUploadFile(filePath, gcsFilePath) {
    if (typeof gcsFilePath !== 'string') {
      this.logger.debug(`GCS Bucket: wrong gcs file key provided, Key: ${gcsFilePath}`);
      throw new Error(`GCS Bucket: wrong gcs file key provided, Key: ${gcsFilePath}`);
    }
    if (typeof filePath !== 'string') {
      this.logger.debug(`GCS Bucket: wrong gcs file original path provided, Path: ${filePath}`);
      throw new Error(`GCS Bucket: wrong gcs file original path provided, Path: ${filePath}`);
    }
    this.logger.debug(`GCS Bucket: will upload "${filePath}" to "${gcsFilePath}"`);

    return this.gcsBucket.upload(filePath, { destination: gcsFilePath });
  }

  /**
   * Move a single file to a different destination on GCS Bucket
   *
   * @param {string} filePath original file path
   * @param {string} destinationFilePath Key bucket destination
   *
   * @return {Promise} bucket promise resolves as object with operation results
   */
  gcsMoveFile(filePath, destinationFilePath, prefixRegex = prefixDocProspectRegex) {
    if (typeof destinationFilePath !== 'string') {
      this.logger.debug(`GCS Bucket: wrong gcs file key provided, Key: ${destinationFilePath}`);
      throw new Error(`GCS Bucket: wrong gcs file key provided, Key: ${destinationFilePath}`);
    }
    if (typeof filePath !== 'string') {
      this.logger.debug(`GCS Bucket: wrong gcs file original path provided, Path: ${filePath}`);
      throw new Error(`GCS Bucket: wrong gcs file original path provided, Path: ${filePath}`);
    }
    if (filePath === destinationFilePath) {
      this.logger.debug(`GCS Bucket: destination path cannot be equal to source path: ${filePath} -> ${destinationFilePath}`);
      throw new Error(`GCS Bucket: destination path cannot be equal to source path: ${filePath} -> ${destinationFilePath}`);
    }
    if (!_.isRegExp(prefixRegex)) {
      this.logger.debug(`GCS Bucket: invalid parameter prefixRegex, regular expression was expected: ${prefixRegex}`);
      throw new Error(`GCS Bucket: invalid parameter prefixRegex, regular expression was expected: ${prefixRegex}`);
    }

    if (!filePath.match(prefixRegex)) {
      this.logger.debug(`Cloud Storage Bucket: move gcs file invalid Prefix detected: <${filePath}>`);
      throw new Error(`Cloud Storage Bucket: move file invalid Prefix detected: <${filePath}>`);
    }
    // TODO: check non empty strings, check origin !== destination
    this.logger.debug(`GCS Bucket: will move "${filePath}" to "${destinationFilePath}"`);

    return this.gcsBucket.file(filePath).move(destinationFilePath);
  }

  /**
   * Download a single file to GCS Bucket
   *
   * @param {string} gcsFilePath Key bucket source
   *
   * @return {Promise} bucket promise resolves as object with operation results
   */
  async gcsGetFile(gcsFilePath) {
    if (typeof gcsFilePath !== 'string') {
      this.logger.debug(`GCS Bucket: wrong gcs file key provided, Key: ${gcsFilePath}`);
      throw new Error(`GCS Bucket: wrong gcs file key provided, Key: ${gcsFilePath}`);
    }
    this.logger.debug(`GCS Bucket: will download "${gcsFilePath}" as stream`);
    const cloudFile = this.gcsBucket.file(gcsFilePath);
    const fileExists = await cloudFile.exists();

    if (_.get(fileExists, '[0]', false) === false) {
      throw new Error(`File ${gcsFilePath} was not found`);
    }

    return cloudFile;
  }

  async gcsGetFileDownloadUrl(filePath) {
    const cloudFile = await this.gcsGetFile(filePath);
    const config = {
      version: 'v4',
      action: 'read',
      expires: moment().add(SIGNED_URL_EXPIRATION_TIMEOUT, 'minutes').toDate(),
    };

    return new Promise((resolve, reject) => {
      cloudFile.getSignedUrl(config, (err, url) => {
        if (!_.isNil(err)) {
          this.logger.debug(`GCS Bucket: Error getting signed url for file with prefix: ${filePath}`);
          reject(err);
        }
        resolve(url);
      });
    });
  }

  /**
   * Delete single file from GCS Bucket
   *
   * @param {string} gcsFilePrefix prefix to be deleted
   *
   * @return {Promise} bucket promise resolves as object with operation results
   */
  gcsDeleteFilesByPrefix(gcsFilePrefix) {
    if (!_.isString(gcsFilePrefix) || _.isEmpty(gcsFilePrefix)) {
      throw new Error(`Expected gcsFilePrefix to be non empty string and got ${gcsFilePrefix} instead`);
    }
    this.logger.debug(`GCS Bucket Deleting file from path Prefix: ${gcsFilePrefix}`);

    return this.gcsBucket.deleteFiles({ prefix: gcsFilePrefix });
  }

  deleteFile(keyFilePath) {
    if (!_.isString(keyFilePath) || _.isEmpty(keyFilePath)) {
      throw new Error(`Cloud Storage Bucket: Expected keyFilePath to be non empty string and got ${keyFilePath} instead`);
    }
    this.logger.debug(`Cloud Storage Bucket: will delete file from path Key: ${keyFilePath}`);
    const operations = [
      this.gcsDeleteFile(keyFilePath),
    ];

    if (this.ARCHIVE_FILES_IN_AWS) {
      operations.push(
        this.awsDeleteFiles([keyFilePath]),
      );
    }

    return Promise.all(operations).then(() => {
      this.logger.info(`Cloud Storage Bucket: successfully deleted file "${keyFilePath}"`);
    }).catch((err) => {
      this.logger.debug(`Cloud Storage Bucket: failed to delete to "${keyFilePath}" ${err}`);
      throw new Error(`Cloud Storage Bucket: failed to delete to "${keyFilePath}" ${err}`);
    });
  }

  moveFile(originalFilePath, destinationFilePath, prefixRegex, docSize) {
    prefixRegex = prefixRegex || prefixDocProspectRegex;
    if (typeof destinationFilePath !== 'string') {
      this.logger.debug(`Cloud Storage Bucket: wrong key file key provided, Key: ${destinationFilePath}`);
      throw new Error(`Cloud Storage Bucket: wrong key file key provided, Key: ${destinationFilePath}`);
    }
    if (typeof destinationFilePath !== 'string') {
      this.logger.debug(`Cloud Storage Bucket: wrong key file path provided, Path: ${destinationFilePath}`);
      throw new Error(`Cloud Storage Bucket: wrong key file path provided, Path: ${destinationFilePath}`);
    }
    if (originalFilePath === destinationFilePath) {
      this.logger.debug(`Cloud Storage Bucket: destination path cannot be equal to source path: ${originalFilePath} -> ${destinationFilePath}`);
      throw new Error(`Cloud Storage Bucket: destination path cannot be equal to source path: ${originalFilePath} -> ${destinationFilePath}`);
    }
    if (!_.isRegExp(prefixRegex)) {
      this.logger.debug(`AWS Bucket: invalid parameter prefixRegex, regular expression was expected: ${prefixRegex}`);
      throw new Error(`AWS Bucket: invalid parameter prefixRegex, regular expression was expected: ${prefixRegex}`);
    }
    this.logger.debug(`Cloud Storage Bucket: will move "${originalFilePath}" to "${destinationFilePath}"`);
    const operations = [
      this.gcsMoveFile(originalFilePath, destinationFilePath, prefixRegex),
    ];

    if (this.ARCHIVE_FILES_IN_AWS) {
      operations.push(
        this.awsMoveFile(originalFilePath, destinationFilePath, prefixRegex, docSize),
      );
    }

    return Promise.all(operations).catch((err) => {
      this.logger.debug(`Cloud Storage Bucket: failed to move "${originalFilePath}" to "${destinationFilePath}" ${err}`);
      throw err;
    });
  }

  uploadFile(filePath, keyFilePath) {
    if (typeof keyFilePath !== 'string') {
      this.logger.debug(`Cloud Storage Bucket: wrong key file key provided, Key: ${keyFilePath}`);
      throw new Error(`Cloud Storage Bucket: wrong key file key provided, Key: ${keyFilePath}`);
    }
    if (typeof keyFilePath !== 'string') {
      this.logger.debug(`Cloud Storage Bucket: wrong key file path provided, Path: ${keyFilePath}`);
      throw new Error(`Cloud Storage Bucket: wrong key file path provided, Path: ${keyFilePath}`);
    }
    this.logger.debug(`Cloud Storage Bucket: will upload "${filePath}" to "${keyFilePath}"`);
    const operations = [
      this.gcsUploadFile(filePath, keyFilePath),
      this.awsUploadFile(filePath, keyFilePath),
    ];

    return Promise.all(operations).catch((err) => {
      this.logger.debug(`Cloud Storage Bucket: failed to upload "${filePath}" to "${keyFilePath}" ${err}`);
      throw new Error(`Cloud Storage Bucket: failed to upload "${filePath}" to "${keyFilePath}" ${err}`);
    });
  }

  /**
   * Wipes out multiple files with all of its versions and delete markers from AWS and GCS
   *
   * Note: after executing this method there's no way back
   * all of the backup versions and delete markers will be gone
   * for all files which key matches the provided indexes
   * so use it with extreme caution
   *
   * @param {string} cloudStoragePrefix prefix used to remove
   *
   * @return {Promise} bucket promise resolves as object with empty summary of versions and markers
   */
  wipeOutBucketFiles(cloudStoragePrefix, isProspectDocument = false) {
    if (typeof cloudStoragePrefix !== 'string' || cloudStoragePrefix === '') {
      this.logger.debug(`Cloud Storage Bucket: delete all versions and markers invalid Prefix: <${cloudStoragePrefix}>`);
      throw new Error(`Cloud Storage Bucket: delete all versions and markers invalid Prefix: <${cloudStoragePrefix}>`);
    }
    let prefixRegex = /[a-zA-Z0-9]{24}\/request_files\/[a-zA-Z0-9]{24}\/[a-zA-Z0-9]{24}\//;

    if (isProspectDocument) {
      prefixRegex = /[a-zA-Z0-9]{24}\/prospect_documents\/[a-zA-Z0-9]{24,}/;
    }
    if (!cloudStoragePrefix.match(prefixRegex)) {
      this.logger.debug(`Cloud Storage Bucket: delete all versions and markers invalid Prefix detected: <${cloudStoragePrefix}>`);
      throw new Error(`Cloud Storage Bucket: delete all versions and markers invalid Prefix detected: <${cloudStoragePrefix}>`);
    }
    const operations = [
      this.gcsDeleteFilesByPrefix(cloudStoragePrefix),
      this.awsBucket.deleteAllVersionsAndMarkers({
        // NOTE: warning this Key can be used as a prefix
        Key: cloudStoragePrefix,
      }),
    ];

    return Promise.all(operations).catch((err) => {
      this.logger.debug(`Cloud Storage Bucket: failed to wipe out using prefix "${cloudStoragePrefix}" ${err}`);
      throw new Error(`Cloud Storage Bucket: failed to wipe out using prefix "${cloudStoragePrefix}" ${err}`);
    });
  }

  gcsListFilesWithPrefix(prefixRegex) {
    return this.gcsBucket.getFiles({ prefix: prefixRegex })
      .then((results) => {
        const files = _.get(results, '[0]', []);

        return files.filter((f) => _.isString(f.name) && f.name.match(prefixRegex));
      });
  }

  awsListFilesWithPrefix(prefixRegex) {
    return this.awsBucket.listFiles({ limit: 100 })
      .then((files) => {
        if (!_.isEmpty(files)) {
          return files.filter((f) => _.isString(f.Key) && f.Key.match(prefixRegex));
        }

        return [];
      });
  }

  getProspectFilesOlderThanDate(filterDate, prefixRegex = prefixDocProspectRegex) {
    const parsedFilterDate = moment(filterDate);
    const logger = _.defaultTo(this.logger, defaultLogger);

    logger.debug(`Cloud Storage Bucket: listing prospect files older than date "${parsedFilterDate.format('YYYY-MM-DDThh:mm:ssZ')}"`);
    const operations = [
      this.gcsListFilesWithPrefix(prefixRegex),
    ];

    if (this.ARCHIVE_FILES_IN_AWS) {
      operations.push(this.awsListFilesWithPrefix(prefixRegex));
    }

    return Promise.map(operations, (cloudFiles) => {
      if (!_.isEmpty(cloudFiles)) {
        return cloudFiles.filter((f) => isOldCloudProspect(f, parsedFilterDate));
      }

      return Promise.resolve();
    }).then((oldCloudFiles) => {
      const awsFiles = _.get(oldCloudFiles, '[0]', []);
      const gcsFiles = _.get(oldCloudFiles, '[1]', []);
      const filesForDeletion = awsFiles.concat(gcsFiles);

      logger.debug(`Cloud Storage Bucket: There are ${filesForDeletion.length} files for deletion matching prefix ${prefixRegex}"`);

      return filesForDeletion;
    }).catch((err) => {
      const message = _.get(err, 'message', err);

      logger.debug(`Cloud Storage Bucket: failed to list prospect files from cloud with prefix ${prefixRegex}. Err: ", ${message}`);
    });
  }

  async gcsUploadFilesViaStream(req, files) {
    this.logger.debug('Uploading files to GCS via stream');
    const uploadedFiles = [];

    return Promise.map(files, (file) => this.cloudStorageEngine._handleSwaggerFileUploading(req, file)
      .then((uploadedFile) => {
        this.logger.debug(`File ${file.originalName} has been uploaded to the cloud`);
        uploadedFiles.push(uploadedFile);
      }).catch((err) => {
        const message = _.get(err, 'message', err);

        this.logger.debug(`File ${file.originalName} failed to be uploaded to the cloud: Err: ${message}`);
        throw err;
      }))
      .then(() => {
        this.logger.debug('All files have been uploaded to the cloud');

        return uploadedFiles;
      })
      .catch((err) => {
        const message = _.get(err, 'message', err);

        this.logger.debug(`Failed to upload files to the cloud: ${message}`);
      });
  }

  getUploadWriteStream(key) {
    const gcsFile = this.gcsBucket.file(key);
    return {
      gcsFile,
      gcsWriteStream: gcsFile.createWriteStream(CREATE_WRITE_STREAM_OPTIONS),
    };
  }

  gcsUploadDataViaStream(readStream, destination) {
    return new Promise((resolve, reject) => {
      readStream.on('error', reject);
      const writeStream = this.gcsBucket.file(destination)
        .createWriteStream(CREATE_WRITE_STREAM_OPTIONS);
      writeStream.on('finish', resolve).on('error', reject);
      readStream.pipe(writeStream);
    });
  }

  async streamZipFolder({ res, cloudKey, zipFileName }) {
    const archiveZip = Archiver('zip');
    const [files] = await this.gcsBucket.getFiles({ prefix: cloudKey, delimiter: '/' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', fileContentDisposition(zipFileName));
    archiveZip.pipe(res);
    await Promise.mapSeries(
      files,
      async (file) => {
        const filePath = _.get(file, 'metadata.name', file.path);
        try {
          const filename = _.get(file, 'name', _.get(file, '__file__name__'));
          const cloudFile = await this.gcsGetFile(filePath);
          archiveZip.append(cloudFile.createReadStream(), { name: filename });
        } catch (err) {
          this.logger.debug(`Cloud file was not found: ${_.get(err, 'message', err)}`);
        }
      });
    archiveZip.finalize();
  }

  async streamZipFile({ res, files, zipFileName, dbDocuments = [] }) {
    const archiveZip = Archiver('zip');
    let totalSize = 0;

    _.each(files, (f) => { totalSize += _.get(f, 'size', 0); });
    if (_.get(totalSize, 'size', totalSize) >= ZIP_DOWNLOAD_LIMIT_SIZE) {
      throw new Error(400, { message: 'The total size of the file exceeds the allowed limit' });
    }
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', fileContentDisposition(zipFileName));
    archiveZip.pipe(res);
    await Promise.mapSeries(
      files,
      async (file) => {
        const filePath = _.get(file, 'cloudKey', file.path);
        const md5Hash = _.get(file, 'md5Hash', file.path);
        const dbDocumentMd5Hash = dbDocuments.find((d) => d.cloudKey === filePath);

        if (filePath !== DOCUMENT_PENDING_STATE && !_.isEmpty(filePath)) {
          try {
            const filename = _.get(file, 'name', _.get(file, '__file__name__'));

            await this.gcsGetFile(filePath).then((cloudFile) => {
              const isGzipEncoded = _.get(cloudFile, 'metadata.contentEncoding', '') === 'gzip';
              if (!isGzipEncoded) {
                if (md5Hash !== cloudFile.metadata.md5Hash &&
                    md5Hash !== DEFAULT_HASH_FOR_OLD_FILES &&
                    !_.isEmpty(md5Hash) &&
                  (!_.isNil(dbDocumentMd5Hash) || _.isEmpty(dbDocuments))) {
                  throw new Error(`We have detected an integrity issue with the file from: ${filePath} We were expecting the file hash to be: ${md5Hash} but the hash of the file in the remote storage is ${cloudFile.metadata.md5Hash}.`);
                }
              }
              return archiveZip.append(cloudFile.createReadStream(), { name: filename });
            }).catch(() => this.gcsGetFile(file.path).then((cloudFile) => archiveZip.append(cloudFile.createReadStream(), { name: filename })));
          } catch (err) {
            this.logger.debug(`Cloud file was not found: ${_.get(err, 'message', err)}`);
          }
        }
      },
    );
    archiveZip.finalize();
  }

  async gcpAssertFileExists(filePath, timeoutMs = 60000) {
    const file = this.gcsBucket.file(filePath);

    await awaitCondition(async () => {
      const [exists] = await file.exists();

      return exists;
    }, { timeoutMs, message: `File ${filePath} does not exists in gcp` });
    const [metadata] = await file.getMetadata();
    const { md5Hash } = metadata;

    if (Buffer.from(md5Hash, 'base64').toString('base64') !== md5Hash) {
      throw new Error(`File ${filePath} does not have a valid md5 hash ${md5Hash}`);
    }
  }
  async gcsCopyFile(srcFilePath, destFilePath) {
    try {
      const copyDestination = this.gcsBucket.file(destFilePath);
      const [copiedFile] = await this.gcsBucket.file(srcFilePath).copy(copyDestination);
      const [metadata] = await copiedFile.getMetadata();
      this.logger.info(`Successfully copied from ${srcFilePath} to ${destFilePath}`);
      return [copiedFile, metadata];
    } catch (err) {
      this.logger.error(`Failed to copy to ${destFilePath}. Error: ${err}`);
      throw new Error(`Failed to copy file from ${srcFilePath} to ${destFilePath}. Error: ${err}`);
    }
  }
}

module.exports = CloudStorage;
