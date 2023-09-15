const _ = require('lodash');
const requestUtils = require('../../../../utils/request');
const apiResponse = require('../../../../components/api-response');
const CompetenceLevelAPI = require('./competence-level-api');
const configuration = require('../../../../components/configuration');
const PaginableAPIDecorator = require('../../../../utils/pagination/paginable-api-decorator');
const { pipeWithErrors } = require('../../../../utils/stream');

const { fileContentDisposition, sendResponse, RestError } = apiResponse;

module.exports = {
  async competenceLevelExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new CompetenceLevelAPI(req.$logger, { user, configuration });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'competenceLevelExport', req });
    const csvStream = await paginableApiDecorator.list(filters);

    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async competenceLevelList(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const competenceLevelId = _.get(req, 'swagger.params.competenceLevelId.value');
    const tz = _.get(req.headers, 'lms-tz', '0');
    // Set filter params
    const filters = { __tz: tz };

    filters.attributes = _.get(req, 'swagger.params.attributes.value');
    if (competenceLevelId) {
      filters._id = competenceLevelId;
    }
    const competenceLevelAPI = new CompetenceLevelAPI(req.$logger, { user });
    const paginableApiDecorator = new PaginableAPIDecorator(competenceLevelAPI, req);
    const competenceLevels = await paginableApiDecorator.list(filters);

    if (competenceLevelId) {
      if (competenceLevels && competenceLevels.list.length) {
        return sendResponse(res, 200, {
          competenceLevel: competenceLevels.list[0],
        });
      }
      throw new RestError(404, { message: `Competence level ${competenceLevelId} does not exist` });
    } else {
      return sendResponse(res, 200, competenceLevels);
    }
  },
  async competenceLevelCreate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const competenceLevelAPI = new CompetenceLevelAPI(req.$logger, { user, configuration });
    const competenceLevel = _.get(req, 'swagger.params.data.value');

    try {
      const competenceLevelCreated = await competenceLevelAPI.create(competenceLevel);

      return sendResponse(res, 200, { competenceLevel: competenceLevelCreated });
    } catch (err) {
      if (err instanceof RestError) {
        throw err;
      }
      req.$logger.error(`Error updating competence level. Error: ${err}`);
      throw new RestError(500, { message: `Error updating competence level. Error: ${err}`, stack: _.get(err, 'stack', err) });
    }
  },
  async competenceLevelUpdate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const competenceLevelAPI = new CompetenceLevelAPI(req.$logger, { user, configuration });
    const competenceLevelId = _.get(req, 'swagger.params.competenceLevelId.value');
    const competenceLevel = _.get(req, 'swagger.params.data.value');

    competenceLevel._id = competenceLevelId;
    try {
      const competenceLevelUpdated = await competenceLevelAPI.update(competenceLevel);

      return sendResponse(res, 200, { competenceLevel: competenceLevelUpdated });
    } catch (err) {
      if (err instanceof RestError) {
        throw err;
      }
      req.$logger.error(`Error updating competence level. Error: ${err}`);
      throw new RestError(500, { message: `Error updating competence level. Error: ${err}`, stack: _.get(err, 'stack', err) });
    }
  },
};
