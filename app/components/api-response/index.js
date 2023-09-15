/* eslint-disable no-param-reassign */
const _ = require('lodash');
const http = require('http');
const logger = require('../log/logger');
const version = require('../version');

const restResponse = (code, data, hasError = false) => {
  const jsonResponse = {
    status: {
      message: hasError ? data.message : 'success',
      code,
      error: hasError,
      version,
    },
  };

  if (hasError) {
    // NOTE: this should not be used anymore
    jsonResponse.status.stack = !!data.stack;
  }
  if (!_.isNil(data)) {
    jsonResponse.data = data;
  }
  return jsonResponse;
};

class RestError extends Error {
  constructor(code, options) {
    super();
    logger.error(`RestErrorStackTrace: ${new Error().stack}`);
    if (options && options.stack) {
      this.stack = options.stack;
      logger.error('Stack trace: ', this.stack);
    } else {
      this.stack = (new Error()).stack;
    }
    if (!code) {
      this.code = 500;
    }
    this.code = code;
    this.message = _.get(options, 'message', http.STATUS_CODES[this.code]);
    this.data = _.get(options, 'data');
  }
}

const sendResponse = (res, code, data) => {
  const response = restResponse(code, data);

  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  return Promise.resolve(res.status(code).json(response));
};

const sendErrorResponse = (res, code, data) => {
  const response = restResponse(code, data, true);

  res.status(code).json(response);
};
const fileContentDisposition = filename => `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
const streamFile = (res, file, options) => {
  let error = false;
  const contentType = _.get(options, 'contentType', 'text/csv');
  res.setHeader('Content-Disposition', fileContentDisposition(file.filename));
  res.setHeader('Content-type', contentType);

  file.fileReadStream.pipe(res);

  file.fileReadStream.on('error', (err) => {
    error = true;
    logger.debug(`Failed to generate ${contentType}`, err);
  });

  file.fileReadStream.on('close', () => {
    try {
      file.fileReadStream.destroy();
    } catch (err) {
      logger.debug('Failed to destroy stream', err);
    }

    if (!error && !_.isNil(file.fileStorage)) {
      file.fileStorage.delete();
    }
  });
};

const wrapControllerLogic = async (cb) => {
  try {
    await cb();
  } catch (err) {
    logger.error(`${err} => stack: ${err.stack}`);
    throw err instanceof RestError ? err : new RestError(500, err);
  }
};

module.exports = {
  fileContentDisposition,
  restResponse,
  sendResponse,
  sendErrorResponse,
  streamFile,
  RestError,
  wrapControllerLogic,
};
