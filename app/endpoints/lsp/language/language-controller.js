const _ = require('lodash');
const requestUtils = require('../../../utils/request');
const configuration = require('../../../components/configuration');
const { fileContentDisposition, sendResponse, RestError } = require('../../../components/api-response');
const LanguageAPI = require('./language-api');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const { pipeWithErrors } = require('../../../utils/stream');

module.exports = {
  async languageExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new LanguageAPI(req.$logger, { user, configuration });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'languageExport', req });
    const csvStream = await paginableApiDecorator.list(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async languageList(req, res) {
    const languageFilters = {};
    const user = requestUtils.getUserFromSession(req);
    const languageAPI = new LanguageAPI(req.$logger, { user, configuration });
    const languageId = _.get(req, 'swagger.params.languageId.value');

    // Set filter params
    languageFilters.__tz = _.get(req.headers, 'lms-tz', '0');
    languageFilters.attributes = _.get(req, 'swagger.params.attributes.value');
    languageFilters.deleted = _.get(req, 'swagger.params.withDeleted.value');
    if (languageId) {
      languageFilters._id = languageId;
    }

    // Make request
    const paginableApiDecorator = new PaginableAPIDecorator(languageAPI, req, { listMethod: 'languageList' });
    const languages = await paginableApiDecorator.list(languageFilters);
    if (languageId) {
      if (languages && languages.list.length) {
        return sendResponse(res, 200, {
          language: languages.list[0],
        });
      }
      throw new RestError(404, { message: `Language ${languageId} does not exist` });
    } else {
      return sendResponse(res, 200, languages);
    }
  },
  async languageCreate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const languageAPI = new LanguageAPI(req.$logger, { user });
    const language = _.get(req, 'swagger.params.data.value');
    try {
      const languageCreated = await languageAPI.create(language);
      return sendResponse(res, 200, { language: languageCreated });
    } catch (err) {
      if (!(err instanceof RestError)) {
        this.logger.error(`Error creating language. Error: ${err}`);
        throw new RestError(500, { message: err.toString() });
      }
      throw err;
    }
  },
  async languageUpdate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const languageAPI = new LanguageAPI(req.$logger, { user });
    const languageId = _.get(req, 'swagger.params.languageId.value');
    const language = _.get(req, 'swagger.params.data.value');
    try {
      language._id = languageId;
      const languageUpdated = await languageAPI.update(language);
      return sendResponse(res, 200, { language: languageUpdated });
    } catch (err) {
      if (!(err instanceof RestError)) {
        this.logger.error(`Error updating language. Error: ${err}`);
        throw new RestError(500, { message: err.toString() });
      }
      throw err;
    }
  },
};
