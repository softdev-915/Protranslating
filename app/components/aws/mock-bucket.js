const Promise = require('bluebird');
const AWSBucket = require('../../components/aws/bucket');

const newMockBucket = function () {
  return {
    deleteAllVersionsAndMarkers() { return Promise.resolve(); },
    uploadFile() { return Promise.resolve(); },
    deleteFiles() { return Promise.resolve(); },
    listFileVersions() {
      return Promise.resolve({
        DeleteMarkers: [],
        Versions: [],
      });
    },
  };
};

const chooseProperBucket = function (configuration) {
  const environmentConfig = configuration.environment;
  if (environmentConfig.AWS_S3_BUCKET) {
    return new AWSBucket({
      accessKeyId: environmentConfig.AWS_S3_KEY,
      secretAccessKey: environmentConfig.AWS_S3_SECRET,
      region: 'us-east-1',
      bucketACL: 'private',
      bucketName: environmentConfig.AWS_S3_BUCKET,
      pagingDelay: 5,
    });
  } else if (environmentConfig.NODE_ENV !== 'DEV') {
    throw new Error('Cannot choose proper bucket. No AWS_S3_BUCKET provided');
  } else {
    return newMockBucket();
  }
};

module.exports = {
  chooseProperBucket,
  newMockBucket,
};
