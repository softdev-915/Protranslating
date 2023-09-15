const _ = require('lodash');
const { sendResponse, RestError } = require('../../../../components/api-response');
const requestUtils = require('../../../../utils/request');
const CustomQueryPreferenceAPI = require('./custom-query-preference-api');

module.exports = {

  async get(req, res) {
    let customQueryPreference;
    const customQueryPreferenceAPI = new CustomQueryPreferenceAPI(req.$logger, {
      user: requestUtils.getUserFromSession(req),
    });
    const customQueryId = _.get(req, 'swagger.params.customQueryId.value', '');
    try {
      customQueryPreference = await customQueryPreferenceAPI.get(customQueryId);
    } catch (error) {
      const errorText = JSON.stringify(error, null, 2);
      req.$logger.error(`An error occurred while retrieving a custom query preference. Error: ${errorText}`);
      throw new RestError(500, { message: 'Unable to retrieve a custom query preference' });
    }
    if (_.isNil(customQueryPreference)) {
      throw new RestError(404, { message: 'No preferences found for the custom query' });
    }
    return sendResponse(res, 200, { customQueryPreference });
  },

  async save(req, res) {
    let customQueryPreference;
    const customQueryPreferenceAPI = new CustomQueryPreferenceAPI(req.$logger, {
      user: requestUtils.getUserFromSession(req),
      flags: _.get(req, 'flags'),
    });
    const data = _.get(req, 'swagger.params.data.value', {});
    try {
      customQueryPreference = await customQueryPreferenceAPI.save(data);
    } catch (error) {
      const errorText = JSON.stringify(error, null, 2);
      req.$logger.error(`An error occurred while saving a Custom Query. Error: ${errorText}`);
      throw new RestError(500, error);
    }
    if (_.get(req, 'flags.mock', false)) {
      await customQueryPreferenceAPI.triggerScheduler(req.flags);
    }
    sendResponse(res, 200, { customQueryPreference });
  },

};
