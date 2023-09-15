const _ = require('lodash');
const requestUtils = require('../../../utils/request');
const apiResponse = require('../../../components/api-response');
const SoftwareRequirementAPI = require('./software-requirement-api');
const configuration = require('../../../components/configuration');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const { pipeWithErrors } = require('../../../utils/stream/');

const { sendResponse, fileContentDisposition } = apiResponse;

module.exports = {
  async softwareRequirementExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new SoftwareRequirementAPI(req.$logger, { user, configuration });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'softwareRequirementExport', req });
    const csvStream = await paginableApiDecorator.list(filters);
    res.setHeader('Content-disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async softwareRequirementList(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const tz = _.get(req.headers, 'lms-tz', '0');
    // Set filter params
    const filters = { __tz: tz };
    filters.attributes = _.get(req, 'swagger.params.attributes.value');
    const softwareRequirementAPI = new SoftwareRequirementAPI(req.$logger, { user });
    const paginableApiDecorator = new PaginableAPIDecorator(softwareRequirementAPI, req);
    const softwareRequirements = await paginableApiDecorator.list(filters);
    return sendResponse(res, 200, softwareRequirements);
  },
  async retrieveById(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const softwareRequirementId = _.get(req, 'swagger.params.softwareRequirementId.value');
    const softwareRequirementAPI = new SoftwareRequirementAPI(req.$logger, { user });
    const softwareRequirement = await softwareRequirementAPI.retrieveById(softwareRequirementId);
    return sendResponse(res, 200, { softwareRequirement });
  },
  async softwareRequirementCreate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const softwareRequirementAPI = new SoftwareRequirementAPI(req.$logger, { user, configuration });
    const softwareRequirement = _.get(req, 'swagger.params.data.value');
    const softwareRequirementCreated = await softwareRequirementAPI.create(softwareRequirement);
    return sendResponse(res, 200, { softwareRequirement: softwareRequirementCreated });
  },
  async softwareRequirementUpdate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const softwareRequirementAPI = new SoftwareRequirementAPI(req.$logger, { user, configuration });
    const softwareRequirementId = _.get(req, 'swagger.params.softwareRequirementId.value');
    const softwareRequirement = _.get(req, 'swagger.params.data.value');
    softwareRequirement._id = softwareRequirementId;
    const softwareRequirementUpdated = await softwareRequirementAPI.update(softwareRequirement);
    return sendResponse(res, 200, { softwareRequirement: softwareRequirementUpdated });
  },
};
