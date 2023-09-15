const _ = require('lodash');
const OpportunityAPI = require('./opportunity-api');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const { chooseProperBucket } = require('../../../components/aws/mock-bucket');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const { pipeWithErrors } = require('../../../utils/stream/');
const configuration = require('../../../components/configuration');

const { fileContentDisposition, sendResponse } = apiResponse;

module.exports = {
  async opportunityExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const opportunityAPI = new OpportunityAPI({
      log: req.$logger,
      user,
      configuration,
    });
    const tzQuery = _.get(req.query, '__tz', '0');
    const tz = _.get(req.headers, 'lms-tz', tzQuery);
    const filter = _.get(req.query, 'filter');
    const filters = {
      __tz: tz,
      filter,
    };
    const csvStream = await opportunityAPI.opportunityExport(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async retrieveById(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const opportunityId = _.get(req, 'swagger.params.opportunityId.value');
    const opportunityAPI = new OpportunityAPI({
      user,
      configuration,
      log: req.$logger,
    });
    const opportunityFound = await opportunityAPI.retrieveById(opportunityId);
    return sendResponse(res, 200, { opportunity: opportunityFound });
  },
  async list(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const opportunityAPI = new OpportunityAPI({
      user,
      configuration,
      log: req.$logger,
    });
    const paginableApiDecorator = new PaginableAPIDecorator(opportunityAPI, req);
    const opportunities = await paginableApiDecorator.list(filters);
    return sendResponse(res, 200, opportunities);
  },
  async create(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const bucket = chooseProperBucket(configuration);
    const opportunityAPI = new OpportunityAPI({
      log: req.$logger,
      user,
      configuration,
      bucket,
      mock: req.flags.mock,
    });
    const opportunity = _.get(req, 'swagger.params.data.value');
    const opportunityCreated = await opportunityAPI.create(opportunity);
    return sendResponse(res, 200, { opportunity: opportunityCreated });
  },
  async update(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const bucket = chooseProperBucket(configuration);
    const opportunityAPI = new OpportunityAPI({
      log: req.$logger,
      user,
      configuration,
      bucket,
      mock: req.flags.mock,
    });
    const opportunity = _.get(req, 'swagger.params.data.value');
    const opportunityUpdated = await opportunityAPI.update(opportunity);
    return sendResponse(res, 200, { opportunity: opportunityUpdated });
  },
};
