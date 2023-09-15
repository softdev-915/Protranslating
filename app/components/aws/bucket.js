const fs = require('fs');
const AWS = require('aws-sdk');
const Promise = require('bluebird');
const https = require('https');

const promisify = Promise.promisify;
const COPY_PART_SIZE_MINIMUM_BYTES = 5242880; // 5MB in bytes
const DEFAULT_COPY_PART_SIZE_BYTES = 500000000; // 500 MB in bytes

function calculatePartitionsRangeArray(objectSize) {
  const partitions = [];
  const copyPartSize = DEFAULT_COPY_PART_SIZE_BYTES;
  const numOfPartitions = Math.floor(objectSize / copyPartSize);
  const remainder = objectSize % copyPartSize;
  let index; let
    partition;

  for (index = 0; index < numOfPartitions; index++) {
    const nextIndex = index + 1;
    if (nextIndex === numOfPartitions && remainder < COPY_PART_SIZE_MINIMUM_BYTES) {
      // eslint-disable-next-line no-mixed-operators
      partition = `${index * copyPartSize}-${(nextIndex) * copyPartSize + remainder - 1}`;
    } else {
      // eslint-disable-next-line no-mixed-operators
      partition = `${index * copyPartSize}-${(nextIndex) * copyPartSize - 1}`;
    }
    partitions.push(partition);
  }

  if (remainder >= COPY_PART_SIZE_MINIMUM_BYTES) {
    // eslint-disable-next-line no-mixed-operators
    partition = `${index * copyPartSize}-${index * copyPartSize + remainder - 1}`;
    partitions.push(partition);
  }
  return partitions;
}

const copyPart = function (params, S3) {
  const uploadPartCopyPromise = promisify(S3.uploadPartCopy).bind(S3);
  return uploadPartCopyPromise(params)
    .then(result => Promise.resolve(result))
    .catch(err => Promise.reject(err));
};
const prepareResultsForCopyCompletion = function (copyPartsResultsArray) {
  const resultArray = [];
  copyPartsResultsArray.forEach((_copyPart, index) => {
    const newCopyPart = {};
    newCopyPart.ETag = _copyPart.CopyPartResult.ETag;
    newCopyPart.PartNumber = index + 1;
    resultArray.push(newCopyPart);
  });
  return resultArray;
};

const completeMultipartCopy = function (params, S3) {
  const completeMultipartUploadPromise = promisify(S3.completeMultipartUpload).bind(S3);
  return completeMultipartUploadPromise(params)
    .then(result => Promise.resolve(result))
    .catch(err => Promise.reject(err));
};

const abortMultipartCopy = function (params, S3) {
  const abortMultipartUploadPromise = promisify(S3.abortMultipartUpload).bind(S3);
  return abortMultipartUploadPromise(params)
    .then(() => promisify(S3.listParts).bind(S3, params))
    .catch(err => Promise.reject(err))
    .then((partsList) => {
      if (partsList.Parts && partsList.Parts.length > 0) {
        const err = new Error('Abort procedure passed but copy parts were not removed');
        err.details = partsList;
        return Promise.reject(err);
      }
      const err = new Error('multipart copy aborted');
      err.details = params;
      return Promise.reject(err);
    });
};

// FS
const getFilesizeInBytes = function (filename) {
  if (typeof filename === 'undefined') {
    throw new Error('File path was expected');
  }
  const stats = fs.statSync(filename);
  // TODO: double check size != 0
  const fileSizeInBytes = stats.size;
  return fileSizeInBytes;
};

// Params check
const checkParams = function (params, mandatory) {
  if (typeof params === 'undefined') {
    throw new Error('Parameters are required');
  }
  if (typeof mandatory === 'undefined') {
    throw new Error('Mandatory flags are required');
  }
  // https://stackoverflow.com/a/41981796/467034
  return mandatory.every(prop => typeof params[prop] !== 'undefined');
};

// AWS Config
const AWSConfig = {
  accessKeyId: null,
  secretAccessKey: null,
  region: null,
};

// initializing multipart upload
const createMultipartCopy = function (params, S3) {
  const createMultipartUploadPromise = promisify(S3.createMultipartUpload).bind(S3);
  return createMultipartUploadPromise(params)
    .then(result => Promise.resolve(result.UploadId))
    .catch(err => Promise.reject(err));
};

// Bucket class
const Bucket = function (params) {
  const flags = ['accessKeyId', 'secretAccessKey', 'region', 'bucketName'];
  const hasAllFlags = checkParams(params, flags);
  if (!hasAllFlags) {
    throw new Error('Unable to create bucket instance due parameters missing');
  }
  AWSConfig.accessKeyId = params.accessKeyId;
  AWSConfig.secretAccessKey = params.secretAccessKey;
  AWSConfig.region = params.region;
  const agent = new https.Agent({
    keepAlive: true,
    // Infinity is read as 50 sockets
    maxSockets: Infinity,
  });
  AWSConfig.httpOptions = {
    agent: agent,
  };

  // AWS S3 Docs
  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
  this.S3 = new AWS.S3(AWSConfig);
  this.bucketName = params.bucketName;
  this.bucketACL = params.bucketACL || 'public-read';
  // default paging delay in between calls
  this.pagingDelay = params.pagingDelay || 500;
};

/*
Get All buckets for this account
Result:
 {
  Buckets:
   [ { Name: 'your-bucket-name',
       CreationDate: 2018-03-19T17:49:05.000Z } ],
  Owner:
   { DisplayName: 'cris',
     ID: '...' }
 }
*/
Bucket.prototype.getAllBuckets = function () {
  const S3 = this.S3;
  const listBuckets = promisify(S3.listBuckets).bind(S3);
  return listBuckets();
};

/*
Usage:

Result:
{ signedUrl: 'https://your-bucket-name.s3.amazonaws.com/your-dir/test.js?AWSAccessKeyId=...' }
*/
Bucket.prototype.getUploadUrl = function (customParams) {
  const flags = ['ContentType', 'Key'];
  const hasAllFlags = checkParams(customParams, flags);
  if (!hasAllFlags) {
    throw new Error('Unable to get upload url instance due parameters missing');
  }

  const S3 = this.S3;
  const bucketName = this.bucketName || '';
  const bucketACL = this.bucketACL || '';
  const defaultParams = {
    Expires: 60,
    ACL: bucketACL,
    Bucket: bucketName,
  };
  const params = Object.assign(defaultParams, customParams);
  const getSignedUrlPromise = promisify(S3.getSignedUrl).bind(S3);
  return new Promise(((resolve, reject) => {
    getSignedUrlPromise('putObject', params)
      .then(signedUrl => resolve({ signedUrl: signedUrl }))
      .catch(reject);
  }));
};

/*
 Usage:

 Result:
{ response: { ETag: '"abc..."' },
  url: 'https://your-bucket-name.s3.amazonaws.com/upload-test.txt' }
*/
Bucket.prototype.uploadFile = function (customParams) {
  const flags = ['filePath', 'Key'];
  const hasAllFlags = checkParams(customParams, flags);
  if (!hasAllFlags) {
    throw new Error('Unable to upload files due parameters missing');
  }

  const S3 = this.S3;
  const bucketName = this.bucketName || '';
  const bucketACL = this.bucketACL || '';
  const filePath = customParams.filePath;
  const defaultParams = {
    ACL: bucketACL,
    Bucket: bucketName,
    ContentLength: getFilesizeInBytes(filePath),
    Body: fs.createReadStream(filePath),
  };
  const params = Object.assign(defaultParams, customParams);
  delete params.filePath;

  // Params
  const BucketId = params.Bucket;
  const Key = params.Key;
  const putObjectPromise = promisify(S3.upload).bind(S3);
  return new Promise(((resolve, reject) => putObjectPromise(params)
    .then((response) => {
      const url = `https://${BucketId}.s3.amazonaws.com/${Key}`;
      resolve(Object.assign({
        response: response,
        url: url,
      }));
    })
    .catch(reject)));
};

/*

 Usage:

 Result:
{ response: { ETag: '"abc..."', CopySourceVersionId: 'def...', CopyObjectResult: { ... } },
  url: 'https://your-bucket-name.s3.amazonaws.com/upload-test-copied.txt' } }
 */
Bucket.prototype.copyFile = function (customParams, appendPrefix) {
  const autoAppendPrefix = appendPrefix || false;
  const flags = ['CopySource', 'Key'];
  const hasAllFlags = checkParams(customParams, flags);
  if (!hasAllFlags) {
    throw new Error('Unable to copy files due parameters missing');
  }

  const S3 = this.S3;
  const bucketName = this.bucketName || '';
  const bucketACL = this.bucketACL || '';
  const defaultParams = {
    ACL: bucketACL,
    Bucket: bucketName,
  };
  if (autoAppendPrefix) {
    // customParams.Key = `https://${bucketName}.s3.amazonaws.com/${customParams.Key}`;
    customParams.CopySource = `${bucketName}/${customParams.CopySource}`;
  }
  const params = Object.assign(defaultParams, customParams);
  // Params
  const BucketId = params.Bucket;
  const { Key } = params;
  const copyObjectPromise = promisify(S3.copyObject).bind(S3);
  return new Promise(((resolve, reject) => copyObjectPromise(params)
    .then((response) => {
      const url = `https://${BucketId}.s3.amazonaws.com/${Key}`;
      resolve(Object.assign({
        response: response,
        url: url,
      }));
    })
    .catch(reject)));
};

/*

 Usage:

 Result:
{ response: { ETag: '"abc..."', CopySourceVersionId: 'def...', CopyObjectResult: { ... } },
  url: 'https://your-bucket-name.s3.amazonaws.com/upload-test-copied.txt' } }
 */

Bucket.prototype.copyFileMultipart = function (customParams, appendPrefix, fileSize) {
  const autoAppendPrefix = appendPrefix || false;
  const S3 = this.S3;
  const bucketName = this.bucketName || '';
  const bucketACL = this.bucketACL || '';
  const defaultParams = {
    ACL: bucketACL,
    Bucket: bucketName,
  };
  const copySource = `${bucketName}/${customParams.CopySource}`;
  if (autoAppendPrefix) {
    customParams.Key = `https://${bucketName}.s3.amazonaws.com/${customParams.Key}`;
    delete customParams.CopySource;
  }
  const params = Object.assign(defaultParams, customParams);
  // Params
  const BucketId = params.Bucket;
  const Key = params.Key;
  const copyPartParams = Object.assign({}, params);
  delete copyPartParams.ACL;
  return new Promise(((resolve, reject) => createMultipartCopy(params, S3)
    .then((uploadId) => {
      const url = `https://${BucketId}.s3.amazonaws.com/${Key}`;
      const partitionsRangeArray = calculatePartitionsRangeArray(fileSize);
      const copyPartFunctionsArray = [];
      copyPartParams.CopySource = copySource;
      copyPartParams.UploadId = uploadId;
      partitionsRangeArray.forEach((partitionRange, index) => {
        copyPartParams.PartNumber = index + 1;
        copyPartParams.CopySourceRange = `bytes=${partitionRange}`;
        copyPartFunctionsArray.push(
          copyPart(copyPartParams, S3),
        );
      });
      return Promise.all(copyPartFunctionsArray)
        .then((copyResults) => {
          const copyResultsForCopyCompletion = prepareResultsForCopyCompletion(copyResults);
          const completeParams = {
            Bucket: params.Bucket,
            Key: params.Key,
            MultipartUpload: {
              Parts: copyResultsForCopyCompletion,
            },
            UploadId: uploadId,
          };
          return completeMultipartCopy(completeParams, S3).then((completeResponse) => {
            resolve({
              url: url,
              response: completeResponse,
            });
          });
        })
        .catch(() => {
          const abortParams = {
            Bucket: params.Bucket,
            Key: params.Key,
            UploadId: uploadId,
          };
          return abortMultipartCopy(abortParams, S3);
        });
    })
    .catch((e) => {
      reject(e);
    })));
};

Bucket.prototype.uploadMultipleFiles = function (customParams) {
  const self = this;
  const flags = ['files'];
  const hasAllFlags = checkParams(customParams, flags);
  if (!hasAllFlags) {
    throw new Error('Unable to upload multiple files due parameters missing');
  }

  // check files not empty
  if (typeof customParams.files !== 'object'
    || customParams.files.length < 1) {
    throw new Error('Files array should not be empty');
  }

  const uploadsQueue = [];

  // check files integrity
  customParams.files.forEach((file) => {
    if (typeof file.Key !== 'string') {
      throw new Error('File name Key should be string');
    }
    if (typeof file.filePath === 'undefined') {
      throw new Error('File path should be provided');
    }

    uploadsQueue.push(() => self.uploadFile({
      filePath: file.filePath,
      Key: file.Key,
    }));
  });
  return Promise.resolve(uploadsQueue).mapSeries(f => f());
};

Bucket.prototype.listPagedFileVersions = function (customParams) {
  const { S3 } = this;
  const bucketName = this.bucketName || '';
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listObjectVersions-property
  const defaultParams = {
    Bucket: bucketName,
  };

  // Max limit of objects requested
  if (typeof customParams.limit !== 'undefined') {
    if (typeof customParams.limit !== 'number') {
      throw new Error('Number was expected for limit parameter');
    }
    defaultParams.MaxKeys = customParams.limit;
    delete customParams.limit;
  }

  // Key is only to maintain consistance with File Listing
  // the original s3 api uses prefix
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listObjectVersions-property
  if (typeof customParams.Key !== 'undefined') {
    if (typeof customParams.Key !== 'string'
      || customParams.Key === '') {
      throw new Error('Key parameter was expected to be String');
    }
    defaultParams.Prefix = customParams.Key;
    delete customParams.Key;
  }

  const params = Object.assign(defaultParams, customParams);
  const listObjectVersionsPromise = promisify(S3.listObjectVersions).bind(S3);
  return new Promise(((resolve, reject) => listObjectVersionsPromise(params)
    .then((fileVersions) => { resolve(fileVersions); })
    .catch(reject)));
};

Bucket.prototype.listFileVersions = function (customParams) {
  const self = this;
  const versions = [];
  const markers = [];
  let pageDelay = self.pagingDelay;
  // Max limit of objects requested
  if (typeof customParams.limit !== 'undefined') {
    if (typeof customParams.limit !== 'number') {
      throw new Error('Number was expected for limit parameter');
    }
    customParams.MaxKeys = customParams.limit;
    delete customParams.limit;
  }

  // Max pagedelay of objects requested
  if (typeof customParams.delay !== 'undefined') {
    if (typeof customParams.delay !== 'number') {
      throw new Error('Number was expected for delay parameter');
    }
    pageDelay = customParams.delay;
    delete customParams.delay;
  }

  // Key is only to maintain consistance with File Listing
  // the original s3 api uses prefix
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listObjectVersions-property
  if (typeof customParams.Key !== 'undefined') {
    if (typeof customParams.Key !== 'string'
      || customParams.Key === '') {
      throw new Error('Key parameter was expected to be String');
    }
    customParams.Prefix = customParams.Key;
    delete customParams.Key;
  }
  return self._fetchVersionsAndMarkers(customParams, versions, markers, pageDelay);
};

Bucket.prototype._fetchVersionsAndMarkers = function (customParams, versions, markers, pageDelay) {
  const self = this;
  const delay = pageDelay || self.pagingDelay;
  return self.listPagedFileVersions(customParams).then((res) => {
    versions = versions.concat(res.Versions);
    markers = markers.concat(res.DeleteMarkers);
    if (!res.IsTruncated) {
      return {
        Versions: versions,
        DeleteMarkers: markers,
      };
    }
    return Promise.delay(delay).then(() => {
      customParams.VersionIdMarker = res.NextVersionIdMarker;
      customParams.KeyMarker = res.NextKeyMarker;
      return self._fetchVersionsAndMarkers(customParams, versions, markers, delay);
    });
  });
};

Bucket.prototype.deleteAllVersions = function (customParams, _deleteVersions, _deleteMarkers) {
  const self = this;
  const deleteMarkers = _deleteMarkers || false;
  const deleteVersions = _deleteVersions || true;
  const flags = ['Key'];
  const hasAllFlags = checkParams(customParams, flags);
  if (!hasAllFlags) {
    throw new Error('Unable to delete all file versions due parameters missing');
  }
  const fileKey = customParams.Key;
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listObjectVersions-property
  const params = {
    Key: fileKey,
  };
  return self.listFileVersions(params).then((fileVersions) => {
    // Create and array of files versions to remove
    let files = [];

    if (deleteVersions) {
      files = fileVersions.Versions.map((version) => {
        const file = { Key: null, VersionId: null };
        if (typeof version.Key !== 'string') {
          throw new Error('File name Key should be string');
        }
        if (typeof version.VersionId === 'undefined') {
          throw new Error('File VersionId should be provided');
        }

        file.Key = version.Key;
        file.VersionId = version.VersionId;
        return file;
      });
    }

    if (deleteMarkers) {
      const markers = fileVersions.DeleteMarkers.map((version) => {
        const file = { Key: null, VersionId: null };
        if (typeof version.Key !== 'string') {
          throw new Error('File name Key should be string');
        }
        if (typeof version.VersionId === 'undefined') {
          throw new Error('File VersionId should be provided');
        }

        file.Key = version.Key;
        file.VersionId = version.VersionId;
        return file;
      });
      // Apend files with VersionId to the operation
      files = files.concat(markers);
    }

    if (files.length === 0) {
      // No files to delete
      return { Deleted: [] };
    }
    // Delete All the Versions (and Markers) found for the same file Key
    return self.deleteFilesVersioned({ files: files });
  });
};

Bucket.prototype.deleteAllMarkers = function (customParams) {
  return this.deleteAllVersions(customParams, false, true);
};

Bucket.prototype.deleteAllVersionsAndMarkers = function (customParams) {
  return this.deleteAllVersions(customParams, true, true);
};

/*

Usage:

Result:
{ IsTruncated: false,
  Contents:
   [ { Key: 'upload-test.txt',
       LastModified: 2018-04-15T22:48:27.000Z,
       ETag: '"abc..."',
       Size: 26,
       StorageClass: 'STANDARD' } ],
  Name: 'your-bucket-name',
  Prefix: '',
  MaxKeys: 1000,
  CommonPrefixes: [],
  KeyCount: 1 }
*/
Bucket.prototype.listPagedFiles = function (customParams) {
  let customBucketName = false;
  if (typeof customParams !== 'undefined'
    && typeof customParams.bucketName === 'string'
    && customParams.bucketName !== '') {
    customBucketName = customParams.bucketName;
  }

  const S3 = this.S3;
  const bucketName = customBucketName || this.bucketName;
  const defaultParams = {
    Bucket: bucketName,
  };

  // Max limit of objects requested
  if (typeof customParams.limit !== 'undefined') {
    if (typeof customParams.limit !== 'number') {
      throw new Error('Number was expected for limit parameter');
    }
    defaultParams.MaxKeys = customParams.limit;
    delete customParams.limit;
  }

  /*
  // this was for listObjects v1 now we are using V2
  if (typeof customParams.startMarker !== 'undefined') {
    if (typeof customParams.startMarker !== 'string'
      || customParams.startMarker === '') {
      throw new Error('Marker parameter was expected to be String');
      return;
    }
    defaultParams.Marker = customParams.startMarker;
  }
  */

  const params = Object.assign(defaultParams, customParams);
  const listObjectsPromise = promisify(S3.listObjectsV2).bind(S3);
  return new Promise(((resolve, reject) => {
    listObjectsPromise(params)
      .then((files) => {
        resolve(files);
      })
      .catch(reject);
  }));
};

Bucket.prototype.listFiles = function (customParams) {
  const self = this;
  const files = [];
  let pageDelay = self.pagingDelay;
  // Max limit of objects requested
  if (typeof customParams.limit !== 'undefined') {
    if (typeof customParams.limit !== 'number') {
      throw new Error('Number was expected for limit parameter');
    }
    customParams.MaxKeys = customParams.limit;
    delete customParams.limit;
  }

  // Max pagedelay of objects requested
  if (typeof customParams.delay !== 'undefined') {
    if (typeof customParams.delay !== 'number') {
      throw new Error('Number was expected for delay parameter');
    }
    pageDelay = customParams.delay;
    delete customParams.delay;
  }
  return self._fetchFiles(customParams, files, pageDelay);
};

Bucket.prototype._fetchFiles = function (customParams, files, pageDelay) {
  const self = this;
  const delay = pageDelay || self.pagingDelay;
  return self.listPagedFiles(customParams).then((res) => {
    files = files.concat(res.Contents);
    if (!res.IsTruncated) {
      return files;
    }
    return Promise.delay(delay).then(() => {
      customParams.ContinuationToken = res.NextContinuationToken;
      return self._fetchFiles(customParams, files, delay);
    });
  });
};

/*
Usage:

Result:
{ Deleted: [ { Key: 'upload-test.txt' } ], Errors: [] }
*/
Bucket.prototype.deleteFiles = function (customParams) {
  const flags = ['files'];
  const hasAllFlags = checkParams(customParams, flags);
  if (!hasAllFlags) {
    throw new Error('Unable to upload files due parameters missing');
  }
  if (typeof customParams.files !== 'object'
    || typeof customParams.files.length < 1) {
    throw new Error('Files array should not be empty');
  }

  const S3 = this.S3;
  const bucketName = this.bucketName;
  const files = customParams.files.map((file) => {
    if (typeof file !== 'string') {
      throw new Error('File name Key should be string');
    }
    return { Key: file };
  });
  const params = {
    Bucket: bucketName,
    Delete: {
      Objects: files,
    },
  };
  const deleteObjectsPromise = promisify(S3.deleteObjects).bind(S3);
  return new Promise(((resolve, reject) => {
    deleteObjectsPromise(params)
      .then((response) => { resolve(response); })
      .catch(reject);
  }));
};

Bucket.prototype.deleteFilesVersioned = function (customParams) {
  const flags = ['files'];
  const hasAllFlags = checkParams(customParams, flags);
  if (!hasAllFlags) {
    throw new Error('Unable to upload files due parameters missing');
  }
  if (typeof customParams.files !== 'object'
    || customParams.files.length < 1) {
    throw new Error('Files array should not be empty');
  }

  const S3 = this.S3;
  const bucketName = this.bucketName;
  const files = customParams.files.map((file) => {
    if (typeof file.Key !== 'string') {
      throw new Error('File name Key should be string');
    }
    if (typeof file.VersionId === 'undefined') {
      throw new Error('File VersionId should be provided');
    }
    return file;
  });
  const params = {
    Bucket: bucketName,
    Delete: {
      Objects: files,
    },
    // Quiet: false
  };
  const deleteObjectsPromise = promisify(S3.deleteObjects).bind(S3);
  return new Promise(((resolve, reject) => {
    deleteObjectsPromise(params)
      .then((response) => { resolve(response); })
      .catch(reject);
  }));
};

Bucket.prototype.updateCredentials = function (credentials) {
  if (typeof credentials === 'undefined') {
    throw new Error('Credentials parameter is mandatory');
  }
  this.S3.config.update({
    credentials: new AWS.Credentials(credentials),
  });
};

Bucket.prototype.updateRegion = function (region) {
  if (typeof region === 'undefined') {
    throw new Error('Region parameter is mandatory');
  }
  this.S3.config.update({ region: region });
};

Bucket.prototype.updateBucketName = function (name) {
  if (typeof name === 'undefined') {
    throw new Error('Name parameter is mandatory');
  }
  this.bucketName = name;
};

module.exports = Bucket;
