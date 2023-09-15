const _ = require('lodash');
/* eslint no-param-reassign: ["error", { "props": false }] */
const version = require('../version');

const codes2Change = {
  SCHEMA_VALIDATION_FAILED: 400,
  ENUM_MISMATCH: 400,
  MAXIMUM: 400,
  MAXIMUM_EXCLUSIVE: 400,
  MINIMUM: 400,
  MINIMUM_EXCLUSIVE: 400,
  MULTIPLE_OF: 400,
  INVALID_TYPE: 400,
  ARRAY_LENGTH_LONG: 400,
  ARRAY_LENGTH_SHORT: 400,
  MAX_LENGTH: 400,
  MIN_LENGTH: 400,
  MAX_PROPERTIES: 400,
  MIN_PROPERTIES: 400,
  REQUIRED: 400,
  LIMIT_UNEXPECTED_FILE: {
    code: 400,
    message: 'Received a file when not expecting one. Either you provided multiple files or used an unexpected parameter name',
  },
};

const isSwagger404 = (err) => Array.isArray(err.allowedMethods)
  && err.message.indexOf('Route defined in Swagger specification') >= 0;

module.exports = () => (
  (err, req, res, next) => {
    if (res.headersSent) {
      return next();
    }
    if (err.status === 400) {
      res.status(400);
      const result = {
        status: {
          message: err.message,
          code: err.status,
          error: true,
          // stack: err.stack,
          stack: true,
          version,
        },
      };
      return res.send(result);
    } if (err.code && codes2Change[err.code]) {
      const specificMessage = codes2Change[err.code];

      if (specificMessage.code) {
        err.code = specificMessage.code;
        err.message = specificMessage.message;
      } else {
        err.code = 400;
      }
    } else if (isSwagger404(err)) {
      err.code = 404;
      err.message = 'Path not found';
    }

    if (err.code === 'EBADCSRFTOKEN') {
      req.$logger.debug(`CSRF failed for ${req.method} ${req.url}`);
      err.code = 401;
    }
    const statusCode = !err.code || err.code > 599 || err.code < 100 ? err.statusCode : err.code;

    res.status(statusCode || 500);
    const result = {
      status: {
        message: err.code ? err.message : 'Internal Server Error',
        code: err.code ? err.code : 500,
        error: true,
        // stack: err.stack,
        stack: true,
        version,
      },
    };

    if (!_.isNil(err.data)) {
      // Send aditional data
      result.status.data = err.data;
    }

    if (res.statusCode >= 500) {
      req.$logger.error(`${err}`);
    }
    res.send(result);
    next();
  }
);
