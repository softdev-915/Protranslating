const _ = require('lodash');
const { RestError, sendResponse } = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const SchemaAPI = require('./schema-api');

module.exports = {

  async list(req, res) {
    let schemas = [];
    const logger = _.get(req, '$logger', {});
    const api = new SchemaAPI(logger, { user: requestUtils.getUserFromSession(req) });
    try {
      schemas = await api.getSchemasForCurrentUser();
    } catch (error) {
      throw new RestError(500, { message: 'Unable to retrieve schemas' });
    }
    sendResponse(res, 200, schemas);
  },

  async fieldValues(req, res) {
    let values = [];
    const logger = _.get(req, '$logger', {});
    const api = new SchemaAPI(logger, { user: requestUtils.getUserFromSession(req) });
    try {
      values = await api.getFieldValues(_.get(req, 'swagger.params.field.value', ''));
    } catch (error) {
      throw new RestError(500, { message: error.message });
    }
    sendResponse(res, 200, values);
  },

};
