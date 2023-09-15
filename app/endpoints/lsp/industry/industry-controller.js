const { sendResponse } = require('../../../components/api-response');
const IndustryAPI = require('./industry-api');

module.exports = {
  async list(req, res) {
    const industryList = IndustryAPI.getList();
    const response = {
      list: industryList,
      total: industryList.length,
    };
    return sendResponse(res, 200, response);
  },
};
