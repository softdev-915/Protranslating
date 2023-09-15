const _ = require('lodash');
const winston = require('winston');
const moment = require('moment');
const RotatingTransportsFile = require('winston-daily-rotate-file');
const configuration = require('../configuration');

class LoggerFactory {
  constructor(logLevel = null, transports = []) {
    const { NODE_LOGS_PATH, NODE_LOGS_LEVEL } = configuration.environment;
    this._loggerInstance = null;
    this.contextData = {};
    const loggerLogLevel = _.isNil(logLevel) ? NODE_LOGS_LEVEL || 'info' : logLevel;
    this._setLoggerInstance(loggerLogLevel, NODE_LOGS_PATH, transports);
  }

  _setLoggerInstance(logLevel, logPath, transports) {
    const loggerTransports = !_.isEmpty(transports)
      ? transports
      : this._getDefaultTransports(logPath);
    this._loggerInstance = winston.createLogger({
      level: logLevel,
      timestamp: () => moment().utc().toDate(),
      transports: loggerTransports,
    });
  }

  _getDefaultTransports(logPath) {
    return !_.isEmpty(logPath)
      ? [
        new (RotatingTransportsFile)({
          filename: logPath,
          stringify: ({
            level,
            timestamp,
            message,
            requestId,
            requestUrl,
            sessionID,
            label,
            pid,
            hostname,
            jobName,
          }) => JSON.stringify({
            level,
            timestamp,
            message,
            requestId,
            requestUrl,
            sessionID,
            label,
            pid,
            hostname,
            jobName,
          }),
        }),
      ]
      : [new (winston.transports.Console)({ debugStdout: true })];
  }

  silly(message, data = {}) {
    this._sendLogMessage('silly', message, data);
  }

  verbose(message, data = {}) {
    this._sendLogMessage('verbose', message, data);
  }

  debug(message, data = {}) {
    this._sendLogMessage('debug', message, data);
  }

  info(message, data = {}) {
    this._sendLogMessage('info', message, data);
  }

  warn(message, data = {}) {
    this._sendLogMessage('warn', message, data);
  }

  error(message, data = {}) {
    this._sendLogMessage('error', message, data);
  }

  _sendLogMessage(method, message, data = {}) {
    const logMessage = _.isString(message) ? message.replace(/[^\x20-\x7E]+/g, ' ') : message;
    const logData = { ...this.contextData, ...data };
    this._loggerInstance[method](logMessage, logData);
  }

  getInstance() {
    return this;
  }

  setContext(data) {
    this.contextData = data;
  }
}

module.exports = LoggerFactory;
