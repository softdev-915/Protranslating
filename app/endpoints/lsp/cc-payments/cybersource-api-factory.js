const _ = require('lodash');
const CybersourceApiClient = require('./cybersource-api-client');
const CybersourceMockApiClient = require('./cybersource-mock-api-client');
const configuration = require('../../../components/configuration');

const cybersourceApiFactory = (logger, options) => {
  const { NODE_ENV } = configuration.environment;

  return NODE_ENV !== 'PROD' && _.get(options, 'flags.mock', false)
    ? new CybersourceMockApiClient(logger, _.get(options, 'flags', {}))
    : new CybersourceApiClient(logger);
};

module.exports = cybersourceApiFactory;
