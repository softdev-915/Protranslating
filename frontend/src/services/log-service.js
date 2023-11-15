/* global document */
import moment from 'moment';
import _isFunction from 'lodash/isFunction';
import _isEmpty from 'lodash/isEmpty';
import _isNil from 'lodash/isNil';
import logResource from '../resources/log';
import resourceWrapper from './resource-wrapper';

export default class LogService {
  constructor(resource = logResource) {
    this.resource = _isFunction(resource) ? resource() : resource;
    this.lastTimeSentRequest = null;
    this.sendRequestDiffMs = 500;
  }

  /**
   * @param {string} message
   * @param {Object} data
   */
  silly(message, data = {}) {
    this._tryToSendLog(message, 'silly', data);
  }

  /**
   * @param {string} message
   * @param {Object} data
   */
  debug(message, data = {}) {
    this._tryToSendLog(message, 'debug', data);
  }

  /**
   * @param {string} message
   * @param {Object} data
   */
  verbose(message, data = {}) {
    this._tryToSendLog(message, 'verbose', data);
  }

  /**
   * @param {string} message
   * @param {Object} data
   */
  info(message, data = {}) {
    this._tryToSendLog(message, 'info', data);
  }

  /**
   * @param {string} message
   * @param {Object} data
   */
  warn(message, data = {}) {
    this._sendLog(message, 'warn', data);
  }

  /**
   * @param {string} message
   * @param {Object} data
   */
  error(message, data = {}) {
    this._sendLog(message, 'error', data);
  }

  /**
   * @param {Error} error
   * @param {string} message
   * @param {Object} data
   */
  registerException(error, message = '', data = {}) {
    let logMessage = message;
    if (!_isEmpty(logMessage)) {
      logMessage += '. ';
    }
    logMessage += error.stack;
    this.error(logMessage, data);
  }

  _tryToSendLog(message, logLevel, data = {}) {
    const sendingDate = moment().utc();
    if (
      _isNil(this.lastTimeSentRequest)
      || sendingDate.diff(this.lastTimeSentRequest, 'milliseconds') > this.sendRequestDiffMs
    ) {
      this.lastTimeSentRequest = moment().utc();
      this._sendLog(message, logLevel, data);
    }
  }

  /**
   * @private
   * @param {string} message
   * @param {string} logLevel
   * @param {Object} data
   */
  _sendLog(message, logLevel, data = {}) {
    let requestMessage = `Frontend: ${message}`;
    const requestData = { ...data, url: document.location.href };
    Object.entries(requestData).forEach(([fieldName, fieldValue]) => {
      requestMessage = `${requestMessage} ${fieldName}=${fieldValue}`;
    });
    resourceWrapper(this.resource.save({ message: requestMessage, logLevel }), false);
  }
}
