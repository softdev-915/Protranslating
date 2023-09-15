const _ = require('lodash');
const appLogger = require('./logger');

class ApplicationLogger {
  constructor(requestData, logLevel, logger) {
    this.requestData = requestData;
    if (_.isEmpty(logger)) {
      this.logger = appLogger;
    } else {
      this.logger = logger;
    }
    const keys = Object.keys(this.logger.transports);

    if (_.isEmpty(logLevel)) {
      logLevel = 'info';
    }
    keys.forEach((k) => { this.logger.transports[k].level = logLevel; });
  }

  silly(message) {
    this.logger.silly(message, {
      requestUrl: this.requestData.req.url,
      requestId: this.requestData.req.id,
      sessionID: this.requestData.req.sessionID,
    });
  }

  debug(message) {
    this.logger.debug(message, {
      requestUrl: this.requestData.req.url,
      requestId: this.requestData.req.id,
      sessionID: this.requestData.req.sessionID,
    });
  }

  verbose(message) {
    this.logger.verbose(message, {
      requestUrl: this.requestData.req.url,
      requestId: this.requestData.req.id,
      sessionID: this.requestData.req.sessionID,
    });
  }

  info(message) {
    this.logger.info(message, {
      requestUrl: this.requestData.req.url,
      requestId: this.requestData.req.id,
      sessionID: this.requestData.req.sessionID,
    });
  }

  warn(message) {
    this.logger.warn(message, {
      requestUrl: this.requestData.req.url,
      requestId: this.requestData.req.id,
      sessionID: this.requestData.req.sessionID,
    });
  }

  error(message) {
    this.logger.error(message, {
      requestUrl: this.requestData.req.url,
      requestId: this.requestData.req.id,
      sessionID: this.requestData.req.sessionID,
    });
  }
}

module.exports = ApplicationLogger;
