const LoggerFactory = require('./logger-factory');

class NullLogger extends LoggerFactory {
  // eslint-disable-next-line no-unused-vars
  _setLoggerInstance(logLevel, logPath, transports) {
    // do nothing
  }

  // eslint-disable-next-line no-unused-vars
  _sendLogMessage(method, message, data) {
    // do nothing
  }
}

module.exports = new NullLogger();
