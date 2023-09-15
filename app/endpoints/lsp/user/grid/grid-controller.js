const _ = require('lodash');
const apiResponse = require('../../../../components/api-response');
const GridAPI = require('./grid-api');
const requestUtils = require('../../../../utils/request');

const sendResponse = apiResponse.sendResponse;

module.exports = {
  async gridConfigByUser(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const gridApi = new GridAPI(req.$logger);
    const grids = await gridApi.gridConfigByUser(user);
    return sendResponse(res, 200, grids);
  },
  async updateGridConfig(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const gridName = _.get(req, 'swagger.params.name.value');
    const configs = _.get(req, 'swagger.params.data.value');
    const gridApi = new GridAPI(req.$logger);
    const newGrid = {
      grid: gridName,
      configs,
    };
    const grid = await gridApi.updateGridConfig(user, newGrid);
    return sendResponse(res, 200, grid);
  },
  async deleteGridConfig(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const gridName = _.get(req, 'swagger.params.name.value');
    const gridApi = new GridAPI(req.$logger);
    const gridDeleted = await gridApi
      .deleteGridConfig(user, gridName);
    return sendResponse(res, 200, gridDeleted);
  },
};
