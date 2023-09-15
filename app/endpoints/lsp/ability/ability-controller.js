const _ = require('lodash');
const requestUtils = require('../../../utils/request');
const apiResponse = require('../../../components/api-response');
const AbilityAPI = require('./ability-api');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const configuration = require('../../../components/configuration');
const { pipeWithErrors } = require('../../../utils/stream/');

const { fileContentDisposition, sendResponse, RestError } = apiResponse;

module.exports = {
  async abilityExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new AbilityAPI(req.$logger, { user, configuration });
    const filters = {
      __tz: _.get(req.session, 'lmsTz', '0'),
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'abilityExport', req });
    const csvStream = await paginableApiDecorator.list(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async abilityList(req, res) {
    try {
      const abilityFilters = {};
      const user = requestUtils.getUserFromSession(req);
      const abilityAPI = new AbilityAPI(req.$logger, { user, configuration });
      const abilityId = _.get(req, 'swagger.params.abilityId.value');
      abilityFilters.__tz = _.get(req.session, 'lmsTz', '0');
      abilityFilters.attributes = _.get(req, 'swagger.params.attributes.value');
      abilityFilters.deleted = _.get(req, 'swagger.params.withDeleted.value');
      if (abilityId) {
        abilityFilters._id = abilityId;
      }

      // Make request
      const paginableApiDecorator = new PaginableAPIDecorator(abilityAPI, req, { listMethod: 'abilityList' });
      const abilities = await paginableApiDecorator.list(abilityFilters);
      if (abilityId) {
        if (abilities && abilities.list.length) {
          return sendResponse(res, 200, {
            ability: abilities.list[0],
          });
        }
        throw new RestError(404, { message: `Ability ${abilityId} does not exist` });
      } else {
        return sendResponse(res, 200, abilities);
      }
    } catch (error) {
      req.$logger.debug('Failed to retrieve abilities');
      req.$logger.error(error);
    }
  },
  async abilityCreate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const abilityAPI = new AbilityAPI(req.$logger, { user });
    const ability = _.get(req, 'swagger.params.data.value');
    const abilityCreated = await abilityAPI
      .create(user, ability);
    return sendResponse(res, 200, { ability: abilityCreated });
  },
  async abilityUpdate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const abilityAPI = new AbilityAPI(req.$logger, { user });
    const ability = _.get(req, 'swagger.params.data.value');
    const abilityId = _.get(req, 'swagger.params.abilityId.value');
    ability._id = abilityId;
    const abilityUpdated = await abilityAPI
      .update(user, ability);
    return sendResponse(res, 200, { ability: abilityUpdated });
  },
};
