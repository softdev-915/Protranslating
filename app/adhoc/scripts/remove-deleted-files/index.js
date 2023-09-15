/* eslint-disable no-console */
/**
 * This script removes physical files that are marked as deleted in the database
 *
 * Usage: node index.js -l {logLevel} where logLevel can be error, info, debug
 *
 */
const loggerFactory = require('../../../import/src/stdout-logger');
const mongo = require('../../../import/src/connection');
const configuration = require('../../../components/configuration');
const RemoveDeletedFiles = require('./remove-deleted-files');
const mongooseSchema = require('../../../components/database/mongo').models;

const logLevel = process.argv[3];
const logger = loggerFactory(logLevel);
const removeDeletedFiles = new RemoveDeletedFiles(logger, configuration, mongooseSchema);
const onScriptFailed = (e) => {
  const message = e.message || e;
  const errorMessage = `Script failed. Reason: ${message}`;
  console.log(errorMessage);
  console.log(`Stack: ${e.stack}`);
  if (logger) {
    logger.error(errorMessage);
    logger.error(`Stack: ${e.stack}`);
  } else {
    console.log(errorMessage);
    console.log(`Stack: ${e.stack}`);
  }
  process.exit(-1);
};

const onScriptSuccess = () => {
  const successMessage = 'Import finished successfully';
  if (logger) {
    logger.info(successMessage);
  } else {
    console.log(successMessage);
  }
  process.exit(0);
};

const start = (maxRetries, retry = 0) => {
  if (retry === maxRetries) {
    return Promise.reject(new Error('Max retry count reached'));
  }
  return removeDeletedFiles.removeDeletedFiles().catch((err) => {
    logger.error(`Operation failed: ${err}`);
    logger.error(`Operation failed stack: ${err.stack}`);
    logger.info('There were errors during the process: Retrying...');
    return start(maxRetries, retry + 1);
  });
};

try {
  logger.info('Starting process');
  logger.debug('Attempting to connect to mongo');
  // Retry process 3 times
  mongo.connect(logger).catch(onScriptFailed)
    .then(() => start(3).then(onScriptSuccess).catch(onScriptFailed));
} catch (e) {
  onScriptFailed(e);
}
