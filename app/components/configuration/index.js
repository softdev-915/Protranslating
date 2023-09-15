const { get } = require('lodash');
const { config } = require('./config');
const environmentConfig = require('./env-config');

module.exports = {
  get(expression) {
    return get(config, expression);
  },
  get environment() {
    return environmentConfig;
  },
};
