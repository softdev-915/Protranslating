const CompromisedPasswordApi = require('./compromised-password-api');
const defaultController = require('../../../utils/default-controller');

module.exports = defaultController(CompromisedPasswordApi, 'compromisedPassword');
