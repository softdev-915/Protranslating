const _ = require('lodash');
const { sendErrorResponse } = require('../api-response');
const logger = require('../log/logger');

const HEADER_PREFIX = 'migrations-running';

module.exports = (migrationRunner) => async (req, res, next) => {
  try {
    if (!_.isEmpty(migrationRunner.failedMigration)) {
      res.setHeader(HEADER_PREFIX, true);

      return sendErrorResponse(res, 503, {
        message: migrationRunner.failedMigration,
      });
    } if (migrationRunner.areMigrationsRunning) {
      res.setHeader(HEADER_PREFIX, true);

      return sendErrorResponse(res, 503, {
        message: 'Database migrations are running. Please try again a bit later',
      });
    }
  } catch (err) {
    logger.error(err);

    return sendErrorResponse(res, 500, {
      message: err,
    });
  }
  next();
};
