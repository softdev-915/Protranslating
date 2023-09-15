const _ = require('lodash');
const mongoConnection = require('./index');
const logger = require('../../log/logger');

async function provideTransaction(cb, transactionOptions = {}, loggerPrefix = 'provideTransaction') {
  logger.debug(`${loggerPrefix}. Starting mongoose session`);
  const session = await mongoConnection.mongoose.startSession();
  logger.debug(`${loggerPrefix}. Finished starting mongoose session`);
  try {
    logger.debug(`${loggerPrefix}. Executing transaction`);
    await session.withTransaction(cb, transactionOptions);
    logger.debug(`${loggerPrefix}. Finished executing transaction`);
  } catch (e) {
    throw e;
  } finally {
    logger.debug(`${loggerPrefix}. Ending mongoose session`);
    await session.endSession();
    logger.debug(`${loggerPrefix}. Finished ending mongoose session`);
  }
}

const generateEntityFieldsPathsMap = (fieldMap) => {
  const keys = _.keys(fieldMap);
  return keys.reduce((acc, key) => {
    let fields = _.defaultTo(fieldMap.fields, []);
    if (key !== 'fields') {
      fields = generateEntityFieldsPathsMap(fieldMap[key]);
      fields = fields.map(field => `${key}.${field}`);
    }
    return acc.concat(fields);
  }, []);
};

module.exports = {
  provideTransaction,
  generateEntityFieldsPathsMap,
};
