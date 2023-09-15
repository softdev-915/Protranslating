const requestUtils = require('../../../utils/request');
const apiResponse = require('../../../components/api-response');
const CountryAPI = require('./country-api');

const { sendResponse } = apiResponse;

module.exports = {
  async countryList(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const countryAPI = new CountryAPI(req.$logger, { user });
    const countries = await countryAPI.countryList();
    const response = {
      list: countries,
      total: countries.length,
    };
    return sendResponse(res, 200, response);
  },
};
