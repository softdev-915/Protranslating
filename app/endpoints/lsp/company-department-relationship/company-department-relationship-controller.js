const _ = require('lodash');
const moment = require('moment');
const CompanyDepartmentRelationshipApi = require('./company-department-relationship-api');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const configuration = require('../../../components/configuration');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const { streamFile } = require('../../../components/api-response');

const { sendResponse } = apiResponse;

module.exports = {
  async companyDepartmentRelationshipExport(req, res) {
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const user = requestUtils.getUserFromSession(req);
    const api = new CompanyDepartmentRelationshipApi(req.$logger, { user, configuration, lspId });
    const tz = _.get(req.headers, 'lms-tz', moment().utcOffset().toString());
    const filters = { __tz: tz };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'companyDepartmentRelationshipExport' });
    const csvStream = await paginableApiDecorator.list(filters);
    streamFile(res, csvStream);
  },
  async list(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const tz = _.get(req.headers, 'lms-tz', '0');
    // Set filter params
    const filters = { __tz: tz };
    filters.attributes = _.get(req, 'swagger.params.attributes.value');
    const companyDepartmentRelationshipApi = new CompanyDepartmentRelationshipApi(req.$logger, {
      user,
    });
    const paginableApiDecorator = new PaginableAPIDecorator(companyDepartmentRelationshipApi, req);
    const companyDepartmentRelationships = await paginableApiDecorator.list(filters);
    return sendResponse(res, 200, companyDepartmentRelationships);
  },

  async retrieveById(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const companyDepartmentRelationshipId = _.get(req, 'swagger.params.companyDepartmentRelationshipId.value');
    const companyDepartmentRelationshipApi = new CompanyDepartmentRelationshipApi(req.$logger, {
      user,
    });
    const companyDepartmentRelationship =
      await companyDepartmentRelationshipApi.retrieveById(companyDepartmentRelationshipId);
    return sendResponse(res, 200, { companyDepartmentRelationship });
  },
  async create(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const companyDepartmentRelationshipApi =
      new CompanyDepartmentRelationshipApi(req.$logger, { user });
    const companyDepartmentRelationShip = _.get(req, 'swagger.params.data.value');
    const companyDepartmentRelationshipCreated =
      await companyDepartmentRelationshipApi.create(companyDepartmentRelationShip);
    return sendResponse(res, 200, {
      companyDepartmentRelationShip: companyDepartmentRelationshipCreated,
    });
  },
  async update(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const companyDepartmentRelationshipApi = new CompanyDepartmentRelationshipApi(req.$logger, {
      user,
    });
    const companyDepartmentRelationshipId = _.get(req, 'swagger.params.companyDepartmentRelationshipId.value');
    const companyDepartmentRelationShip = _.get(req, 'swagger.params.data.value');
    companyDepartmentRelationShip._id = companyDepartmentRelationshipId;
    const companyDepartmentRelationshipUpdated =
      await companyDepartmentRelationshipApi.update(companyDepartmentRelationShip);
    return sendResponse(res, 200, {
      companyDepartmentRelationship: companyDepartmentRelationshipUpdated,
    });
  },
};
