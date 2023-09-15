const _ = require('lodash');
const stream = require('stream');
const Promise = require('bluebird');
const meter = require('stream-meter');
const { Storage } = require('@google-cloud/storage');
const requestUtils = require('../../utils/request');
const FileStorageFactory = require('../file-storage');
const defaultLogger = require('../log/logger');
const fileUtils = require('../../utils/file');
const { streamToPromise, sanitizeFilename, isValidGcsFilename } = require('../cloud-storage/cloud-storage-helpers');
const AWSBucket = require('../../components/aws/bucket');

const FILES_UPLOAD_BODY_METADATA = 'metadata';
const MOCK_FAILED_UPLOAD_FILENAME = 'failed.txt';
const awsBucketUploadStream = (bucket, Key) => {
  const s3 = bucket.S3;
  const pass = new stream.PassThrough();
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    // Bucket: bucket.name,
    Key: Key,
    Body: pass,
  };
  return {
    awsWriteStream: pass,
    awsUploadHandler: s3.upload(params),
  };
};
const checkFileDuplicatesInRequest = (request, filename) => {
  const nonDeletedDocuments = request.languageCombinations.map(({ documents }) =>
    documents.filter(d => !d.deleted),
  );
  const doesFilenameExistInSource = _.find(nonDeletedDocuments, documents =>
    _.find(documents, { name: filename }),
  );
  if (doesFilenameExistInSource) {
    return true;
  }
  const doesFilenameExistInFinal = _.find(request.finalDocuments, { name: filename });
  if (doesFilenameExistInFinal) {
    return true;
  }
  const doesFilenameExistInWorkflow = _.find(request.workflows, workflow =>
    _.find(workflow.tasks, task => _.find(task.providerTasks, providerTask =>
      _.find(providerTask.files, { name: filename }))),
  );
  if (doesFilenameExistInWorkflow) {
    return true;
  }
  return false;
};

class CloudStorageEngine {
  constructor(options) {
    const configuration = _.get(options, 'configuration');
    this.configuration = configuration;
    if (!configuration) {
      throw new Error('Configuration could not be found');
    }
    const environmentConfig = configuration.environment;
    this.awsBucket = _.get(options, 'awsBucket');
    this.gcsBucket = _.get(options, 'gcsBucket');
    this.ARCHIVE_FILES_IN_AWS = environmentConfig.ARCHIVE_FILES_IN_AWS;
  }

  _handleFile(req, file, cb) {
    const user = requestUtils.getUserFromSession(req);
    const userLspId = _.get(user, 'lsp._id', _.get(req, 'params.lspId'));
    const fileStorageFactory = new FileStorageFactory(userLspId.toString(),
      this.configuration, defaultLogger);
    defaultLogger.info(`Storage Engine: Handling file ${file.originalname} started`);
    // Streams
    let path = '';
    let documentProspect;
    return Promise.resolve().then(() => {
      const extension = fileUtils.getExtension(file.originalname);
      documentProspect = req._generateDocumentProspect({
        name: file.originalname,
        mime: file.mimetype,
        encoding: file.encoding,
      }, file);
      const fileStorage = req._generateProspectFilePath(fileStorageFactory,
        documentProspect, extension);
      path = _.get(fileStorage, 'path', false);
      if (!path) {
        defaultLogger.error('Multer Storage Engine: Incorrect path provided');
        return cb(new Error('Incorrect path provided'));
      }
      const uploadStreamsPromises = [];
      if (this.ARCHIVE_FILES_IN_AWS) {
        const { awsWriteStream, awsUploadHandler } = awsBucketUploadStream(this.awsBucket, path);
        file.stream.pipe(awsWriteStream);
        uploadStreamsPromises.push(awsUploadHandler.promise());
      }
      const { gcsWriteStream } = req.cloudStorage.getUploadWriteStream(path);
      // Pipe file stream to GCS file
      file.stream
        .pipe(gcsWriteStream);
      const gcsUploadPromise = streamToPromise(gcsWriteStream);
      uploadStreamsPromises.push(gcsUploadPromise);
      return Promise.all(uploadStreamsPromises);
    })
      .then(() => this.gcsBucket.file(path).getMetadata())
    // eslint-disable-next-line newline-per-chained-call
      .then((fileMetadata) => {
        const fileSize = _.get(fileMetadata, '[0].size', 0);
        documentProspect.size = fileSize;
        documentProspect.cloudKey = path;
        return documentProspect.save();
      })
    // eslint-disable-next-line arrow-body-style
      .then((prospectDoc) => {
        defaultLogger.info(`Storage Engine: Handling file ${prospectDoc.name} success`);
        // Update document
        return cb(null, {
          documentProspectId: prospectDoc._id,
          cloudKey: prospectDoc.cloudKey,
          path: path,
          size: prospectDoc.size,
        });
      })
      .catch((err) => {
        const message = _.get(err, 'message', err);
        defaultLogger.error(`Multer Storage Engine: Error uploading. Error: ${message}`);
        return cb(err);
      })
      .finally(() => {
        delete req._generateDocumentProspect;
        delete req._generateProspectFilePath;
      });
  }

  _getGcsUploadHander(file, filePath, req) {
    defaultLogger.debug(`Multer Storage Engine: GCS file path is: ${filePath}`);
    const { gcsFile, gcsWriteStream } = req.cloudStorage.getUploadWriteStream(filePath);
    defaultLogger.debug('Multer Storage Engine: Piping gcs stream');
    try {
      file
        .pipe(gcsWriteStream)
        .on('error', (err) => {
          defaultLogger.debug(`Multer Storage Engine: GCS stream error: ${err}`);
          throw new Error(err);
        })
        .on('finish', () => {
          defaultLogger.debug(`Multer Storage Engine: GCS finish uploading file: ${filePath}`);
        });
    } catch (err) {
      defaultLogger.debug(`Failed while piping to GCS with err: ${err}`);
    }
    const gcsUploadPromise = streamToPromise(gcsWriteStream);
    return {
      gcsUploadPromise,
      gcsFile,
    };
  }

  _getAwsUploadHander(file, filePath) {
    const { awsWriteStream, awsUploadHandler } = awsBucketUploadStream(this.awsBucket,
      filePath);
    defaultLogger.debug('Multer Storage Engine: Piping aws stream');
    file
      .pipe(awsWriteStream)
      .on('error', (err) => {
        defaultLogger.debug(`Multer Storage Engine: AWS stream error: ${_.get(err, 'message')}`);
        throw new Error(err);
      });
    return awsUploadHandler.promise();
  }

  uploadFilesToGcsAndAws({ file, filePath, req, sanitizedFilename, documentId }) {
    const uploadStreamsPromises = [];
    if (this.ARCHIVE_FILES_IN_AWS) {
      uploadStreamsPromises.push(this._getAwsUploadHander(file, filePath));
    }
    const { gcsUploadPromise, gcsFile } = this._getGcsUploadHander(file, filePath, req);
    uploadStreamsPromises.push(gcsUploadPromise);
    defaultLogger.debug('Multer Storage Engine: Uploading files to cloud');
    return Promise.all(uploadStreamsPromises)
      .then(() => {
        defaultLogger.debug(`Multer Storage Engine: Successfully uploaded ${sanitizedFilename} to path ${filePath}`);
        return {
          documentId,
          gcsFile,
          file,
          filename: sanitizedFilename,
        };
      })
      .catch((err) => {
        defaultLogger.debug(`Multer Storage Engine: Error ocurred upon uploading file: ${_.get(err, 'message')}`);
        throw new Error(err);
      });
  }

  _handleBusboyMultipleFilesUpload(req, uploadParams) {
    const request = _.get(uploadParams, 'translationRequest');
    const gcs = new Storage({
      keyFilename: process.env.GCS_KEY_FILE,
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
    const gcsBucket = gcs.bucket(process.env.GCS_BUCKET);
    const awsBucket = new AWSBucket({
      accessKeyId: process.env.AWS_S3_KEY,
      secretAccessKey: process.env.AWS_S3_SECRET,
      region: 'us-east-1',
      bucketACL: 'private',
      bucketName: process.env.AWS_S3_BUCKET,
      pagingDelay: 5,
    });
    return new Promise((resolve, reject) => {
      req.pipe(req.busboy);
      const filesData = {
        files: {},
        metadata: null,
      };
      req.busboy.on('finish', async () => {
        try {
          await Promise.map(Object.keys(filesData.files), (fileIndex) => {
            const { uploadStreamsPromises } = filesData.files[fileIndex];
            if (_.isNil(uploadStreamsPromises)) {
              return Promise.resolve();
            }
            return Promise.all(uploadStreamsPromises);
          });
          uploadParams.filesData = filesData;
          return resolve();
        } catch (error) {
          return reject(error);
        }
      });
      req.busboy.on('field', (fieldname, val) => {
        try {
          if (fieldname === FILES_UPLOAD_BODY_METADATA) {
            filesData.metadata = JSON.parse(val);
          }
        } catch (error) {
          const message = _.get(error, 'message', error);
          defaultLogger.error(`Error in files metadata: ${message}`);
        }
      });
      req.busboy.on('file', async (fieldname, file, { filename, encoding, mimeType }) => {
        const hasDuplicatedFilename = checkFileDuplicatesInRequest(request, filename);
        if (hasDuplicatedFilename) {
          uploadParams.failedUploads.push(filename);
          file.resume();
          return reject(new Error('File name is identical with another file name in the request. Uploading is not allowed.'));
        }
        defaultLogger.debug(`Received filename: ${filename} at ${new Date().toISOString()}`);
        const sanitizedFilename = sanitizeFilename(filename);
        const fileIndex = fieldname.split('_')[1];
        if (!isValidGcsFilename(sanitizedFilename)) {
          file.resume();
          return reject(new Error(`The file can not be uploaded because the name: ${filename} is not valid`));
        }
        try {
          const bytesReader = meter();
          const fileData = {
            fieldname,
            filename: sanitizedFilename,
            encoding,
            mimetype: mimeType,
            bytesReader,
          };
          filesData.files[fileIndex] = fileData;
          if (uploadParams.mock && sanitizedFilename === MOCK_FAILED_UPLOAD_FILENAME) {
            file.resume();
            fileData.failed = true;
            return;
          }
          if (!_.isFunction(req._generateFilePath)) {
            file.resume();
            return reject(new Error('_generateFilePath function is not provided'));
          }
          const { filePath, documentId } = req._generateFilePath({ ...uploadParams, ...fileData });
          if (_.isEmpty(filePath)) {
            file.resume();
            return reject(new Error(`Failed to generate file path for file ${filename}`));
          }
          const uploadStreamsPromises = [];
          const awsWriteStream = new stream.PassThrough();
          const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: filePath,
            Body: awsWriteStream,
          };
          const awsUploadHandler = awsBucket.S3.upload(params);
          file.pipe(bytesReader).pipe(awsWriteStream)
            .on('error', (err) => {
              defaultLogger.debug(`AWS stream error: ${err}`);
              fileData.failed = true;
            })
            .on('finish', () => {
              defaultLogger.debug(`AWS finish uploading file ${filename} at ${new Date().toISOString()}`);
            });
          uploadStreamsPromises.push(awsUploadHandler.promise());
          const gcsFile = gcsBucket.file(filePath);
          const gcsWriteStream = gcsFile.createWriteStream({
            gzip: false,
            timeout: 3600000,
            metadata: {
              contentType: 'application/octet-stream',
            },
          });
          file.pipe(gcsWriteStream)
            .on('error', (err) => {
              defaultLogger.debug(`GCS stream error: ${err}`);
              fileData.failed = true;
            })
            .on('finish', () => {
              defaultLogger.debug(`GCS finish uploading file ${filename} at ${new Date().toISOString()}`);
            });
          const gcsUploadPromise = streamToPromise(gcsWriteStream);
          uploadStreamsPromises.push(gcsUploadPromise);
          Object.assign(fileData, {
            uploadStreamsPromises: uploadStreamsPromises,
            documentId: documentId,
            gcsFile: gcsFile,
            filePath: filePath,
          });
        } catch (error) {
          defaultLogger.error(`An unknown error ocurred: ${error}. Request id: ${uploadParams.requestId}`);
          file.resume();
          return reject(error);
        }
      });
      req.busboy.on('error', reject);
    });
  }

  _handleBusboyFileUpload(req, res, uploadParams) {
    defaultLogger.debug('Multer Storage Engine: Handling busboy file uploading');
    return new Promise((resolve, reject) => {
      req.pipe(req.busboy);
      const filesData = {
        files: {},
        metadata: null,
      };
      req.busboy.on('finish', async () => {
        try {
          uploadParams.filesData = filesData;
        } catch (error) {
          return reject(error);
        }
      });
      req.busboy.on('file', (fieldname, file, { filename, encoding, mimeType }) => {
        defaultLogger.debug(`Multer Storage Engine: Busboy received file: ${filename}`);
        const sanitizedFilename = sanitizeFilename(filename);
        if (!isValidGcsFilename(sanitizedFilename)) {
          return reject(new Error(`The file can not be uploaded because the name: ${filename} is not valid`));
        }
        Object.assign(uploadParams, {
          fieldname,
          file,
          filename: sanitizedFilename,
          encoding,
          mimetype: mimeType,
          req,
        });
        if (uploadParams.mock && _.get(uploadParams, 'filename') === MOCK_FAILED_UPLOAD_FILENAME) {
          return reject(new Error(`Failed mock upload for file: ${MOCK_FAILED_UPLOAD_FILENAME}`));
        }
        if (!_.isFunction(req._generateFilePath)) {
          reject(new Error('_generateFilePath function is not provided'));
        }
        const { filePath, documentId } = req._generateFilePath(uploadParams);
        if (_.isEmpty(filePath)) {
          return reject(new Error('Failed to generate file path'));
        }
        Object.assign(uploadParams, { filePath, documentId });
        return this.uploadFilesToGcsAndAws(uploadParams).then(resolve).catch(reject);
      });
    });
  }

  // TODO: replace _handleBusboyFileUpload with the following method
  _handleBusboyFileUploadTemp(req, res, uploadParams) {
    defaultLogger.debug('Multer Storage Engine: Handling busboy file uploading');
    return new Promise((resolve, reject) => {
      req.pipe(req.busboy);
      req.busboy.on('file', async (fieldname, file, { filename, encoding, mimeType }) => {
        try {
          defaultLogger.debug(`Multer Storage Engine: Busboy received file: ${filename}`);
          const sanitizedFilename = sanitizeFilename(filename);
          if (!isValidGcsFilename(sanitizedFilename)) {
            reject(new Error(`The file can not be uploaded because the name: ${filename} is not valid`));
          }
          if (uploadParams.mock && sanitizeFilename === MOCK_FAILED_UPLOAD_FILENAME) {
            reject(new Error(`Failed mock upload for file: ${MOCK_FAILED_UPLOAD_FILENAME}`));
          }
          if (!_.isFunction(req._generateFilePath)) {
            reject(new Error('_generateFilePath function is not provided'));
          }
          const filePathParams = Object.assign({}, uploadParams, {
            fieldname,
            file,
            filename: sanitizedFilename,
            encoding,
            mimetype: mimeType,
          });
          const filePath = req._generateFilePath(filePathParams);
          if (_.isEmpty(filePath)) {
            reject(new Error('Failed to generate file path'));
          }
          const uploadStreamsPromises = [];
          if (this.ARCHIVE_FILES_IN_AWS) {
            const { awsWriteStream, awsUploadHandler } = awsBucketUploadStream(this.awsBucket,
              filePath);
            defaultLogger.debug('Multer Storage Engine: Piping aws stream');
            file
              .pipe(awsWriteStream)
              .on('error', (err) => {
                defaultLogger.debug(`Multer Storage Engine: AWS stream error: ${_.get(err, 'message')}`);
                reject(err);
              });
            uploadStreamsPromises.push(awsUploadHandler.promise());
          }
          defaultLogger.debug(`Multer Storage Engine: GCS file path is: ${filePath}`);
          const { gcsFile, gcsWriteStream } = req.cloudStorage.getUploadWriteStream(filePath);
          defaultLogger.debug('Multer Storage Engine: Piping gcs stream');
          file
            .pipe(gcsWriteStream)
            .on('error', (err) => {
              defaultLogger.debug(`Multer Storage Engine: GCS stream error: ${err}`);
              reject(err);
            });
          const gcsUploadPromise = streamToPromise(gcsWriteStream);
          uploadStreamsPromises.push(gcsUploadPromise);
          defaultLogger.info('Storage Engine: Uploading files to cloud');
          await Promise.all(uploadStreamsPromises);
          defaultLogger.debug(`Multer Storage Engine: Successfully uploaded ${sanitizedFilename} to path ${filePath}`);
          resolve({
            gcsFile,
            file,
            filename: sanitizedFilename,
            fieldname,
            encoding,
            mimetype: mimeType,
          });
        } catch (err) {
          defaultLogger.debug(`Multer Storage Engine: Error ocurred upon uploading file: ${_.get(err, 'message')}`);
          reject(err);
        }
      });
    });
  }

  _removeFile(req, file, cb) {
    // No op
    cb();
  }
}

module.exports = CloudStorageEngine;
