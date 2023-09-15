const _ = require('lodash');

class SiConnectorError extends Error {
  constructor(errors, options) {
    const mock = _.get(options, 'mock', false);
    const error = errors[0];
    const message = `${error.errorno} ${error.description2}`;
    super(message);
    this.mock = mock;
    this.name = 'SiConnectorError';
    this.error = error;
    this.errorList = errors;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SiConnectorError);
    }
  }

  static generateFromApiResponse(response) {
    const rootLevelError = _.get(response, 'response.errormessage.error', []);
    const operationError = _.get(response, 'response.operation.errormessage.error', null);
    const resultErrors = _.get(response, 'response.operation.result.errormessage.error', []);
    const errors = _.flatten(
      [rootLevelError, operationError, resultErrors].filter(e => !_.isNil(e)));
    if (_.isEmpty(errors)) {
      return null;
    }
    return new SiConnectorError(errors);
  }

  static generateMockError(message) {
    const error = { errorno: 'Mock', description2: message };
    return new SiConnectorError([error], { mock: true });
  }
}

module.exports = SiConnectorError;
