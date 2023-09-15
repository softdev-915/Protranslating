const _ = require('lodash');
const logger = require('./logger');

class LoggerWrapper {
  constructor({ prefix = '', postfix = '' }) {
    this.prefix = prefix;
    this.postfix = postfix;
  }

  getMessage(message) {
    return _.filter([this.prefix, message, this.postfix]).join(' ');
  }

  info(message) {
    logger.info(this.getMessage(message));
  }

  debug(message) {
    logger.debug(this.getMessage(message));
  }

  error(message) {
    logger.error(this.getMessage(message));
  }

  warn(message) {
    logger.warn(this.getMessage(message));
  }

  silly(message) {
    logger.silly(this.getMessage(message));
  }

  verbose(message) {
    logger.verbose(this.getMessage(message));
  }
}

module.exports = LoggerWrapper;
