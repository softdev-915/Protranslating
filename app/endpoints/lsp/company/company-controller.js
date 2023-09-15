const _ = require('lodash');
const { chooseProperBucket } = require('../../../components/aws/mock-bucket');
const CompanyAPI = require('./company-api');
const apiResponse = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const configuration = require('../../../components/configuration');
const { extractUserIp } = require('../../../utils/request');
const SiConnectorAPI = require('../../../connectors/si/si-connector-api');

const {
  sendResponse, sendErrorResponse, streamFile, RestError,
} = apiResponse;

module.exports = {
  async companyExport(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const api = new CompanyAPI(req.$logger, { user, configuration, lspId });
    const tz = _.get(req.session, 'lmsTz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'companyExport' });
    const file = await paginableApiDecorator.list(filters);

    streamFile(res, file);
  },
  async nameList(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const select = _.get(req, 'query.params.select', false);
    const companyAPI = new CompanyAPI(req.$logger, { user });

    try {
      const paginableApiDecorator = new PaginableAPIDecorator(companyAPI, req, { listMethod: 'nameList' });
      const response = await paginableApiDecorator.list({ select });
      return sendResponse(res, 200, response);
    } catch (error) {
      return sendErrorResponse(res, 500, { message: _.get(error, 'message', error) }, false);
    }
  },
  async list(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const columns = _.get(req, 'swagger.params.columns.value');
    let ids = _.get(req, 'query.ids');

    if (ids && ids.length) {
      ids = ids.split(',');
    } else {
      ids = null;
    }

    let names = _.get(req, 'query.names');

    if (names && names.length) {
      names = names.split(',');
    } else {
      names = null;
    }

    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      ids,
      names,
      __tz: tz,
    };

    filters.columns = columns;
    const bucket = chooseProperBucket(configuration);
    const companyAPI = new CompanyAPI(req.$logger, { bucket, user });
    let response;

    if (filters.ids) {
      response = await companyAPI.retrieveById(filters);
    } else {
      const paginableApiDecorator = new PaginableAPIDecorator(companyAPI, req);

      response = await paginableApiDecorator.list(filters);
    }
    return sendResponse(res, 200, response);
  },

  async isUploadingAllowedForIp(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const id = _.get(req, 'swagger.params.id.value');
    const clientIP = extractUserIp(req);
    const bucket = chooseProperBucket(configuration);
    const companyAPI = new CompanyAPI(req.$logger, { bucket, user });
    const isFileUploadingAllowed = await companyAPI.isUploadingAllowedForIp(clientIP, id);

    if (isFileUploadingAllowed) {
      return sendResponse(res, 200);
    }
    return sendErrorResponse(res, 403, {
      message: `Your IP ${clientIP} is not allowed to upload files for this company`,
    }, false);
  },
  async getPopulated(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.id.value');
    const select = _.get(req, 'swagger.params.select.value');
    const bucket = chooseProperBucket(configuration);
    const companyAPI = new CompanyAPI(req.$logger, { bucket, user });
    const options = {
      select,
      _id: companyId,
    };
    const company = await companyAPI.getPopulated(user, options);
    const { isUserIpAllowed = true } = res.locals;
    return sendResponse(res, 200, { company, isUserIpAllowed });
  },
  async getPublicInfo(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.id.value');
    const bucket = chooseProperBucket(configuration);
    const companyAPI = new CompanyAPI(req.$logger, { bucket, user });
    const company = await companyAPI.getPublicInfo(companyId);
    return sendResponse(res, 200, { company });
  },
  async getCompanySalesRep(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const id = _.get(req, 'swagger.params.id.value');
    const bucket = chooseProperBucket(configuration);
    const companyAPI = new CompanyAPI(req.$logger, { bucket, user });
    const salesRep = await companyAPI.getCompanySalesRep(id);
    return sendResponse(res, 200, { salesRep });
  },
  async getCompanyAvailableTimeToDeliver(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const id = _.get(req, 'swagger.params.id.value');
    const companyAPI = new CompanyAPI(req.$logger, { user });
    const company = await companyAPI.getCompanyAvailableTimeToDeliver(id);
    return sendResponse(res, 200, company.availableTimeToDeliver);
  },
  async getCompanyRates(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const id = _.get(req, 'swagger.params.id.value');
    const bucket = chooseProperBucket(configuration);
    const companyAPI = new CompanyAPI(req.$logger, { bucket, user });
    const rates = await companyAPI.getCompanyRates(id);
    return sendResponse(res, 200, { rates });
  },
  async getIpRates(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const id = _.get(req, 'swagger.params.id.value');
    const entity = _.get(req, 'swagger.params.entity.value');
    const language = _.get(req, 'swagger.params.language.value');

    try {
      const companyAPI = new CompanyAPI(req.$logger, { user });
      const ipRates = await companyAPI.getIpRates(id, entity, language);
      return sendResponse(res, 200, ipRates);
    } catch (err) {
      const wrappedError = new RestError(500, { message: err.toString() });

      throw err instanceof RestError ? err : wrappedError;
    }
  },
  async resetIpRates(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const id = _.get(req, 'swagger.params.id.value');
    const entity = _.get(req, 'swagger.params.entity.value');
    const language = _.get(req, 'swagger.params.language.value');

    try {
      const companyAPI = new CompanyAPI(req.$logger, { user });
      await companyAPI.resetIpRates(id, entity, language);
      const ipRates = await companyAPI.getIpRates(id, entity, language);
      return sendResponse(res, 200, ipRates);
    } catch (err) {
      const wrappedError = new RestError(500, { message: err.toString() });

      throw err instanceof RestError ? err : wrappedError;
    }
  },
  async updateIpRates(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const id = _.get(req, 'swagger.params.id.value');
    const entity = _.get(req, 'swagger.params.entity.value');
    const language = _.get(req, 'swagger.params.language.value');
    const newRates = _.get(req, 'swagger.params.data.value');
    const defaultCompanyCurrencyCode = _.get(req, 'swagger.params.defaultCompanyCurrencyCode.value', '').toUpperCase();
    try {
      const companyAPI = new CompanyAPI(req.$logger, { user });
      await companyAPI.updateIpRates(id, entity, language, newRates, defaultCompanyCurrencyCode);
      const ipRates = await companyAPI.getIpRates(id, entity, language);
      return sendResponse(res, 200, ipRates);
    } catch (err) {
      const wrappedError = new RestError(500, { message: err.toString() });

      throw err instanceof RestError ? err : wrappedError;
    }
  },
  async create(req, res) {
    const {
      mock, shouldMockSiSyncFail, shouldMockSiDisabled, mockServerTime,
    } = req.flags;
    const user = requestUtils.getUserFromSession(req);
    const bucket = chooseProperBucket(configuration);
    const companyAPI = new CompanyAPI(req.$logger, { bucket, user, mock });
    const siAPI = new SiConnectorAPI({
      mock,
      shouldMockSiSyncFail,
      shouldMockSiDisabled,
      mockServerTime,
    });
    const companyPayload = _.get(req, 'swagger.params.data.value');
    try {
      const company = await companyAPI.create(companyPayload);
      return sendResponse(res, 200, { company })
        .then(() => siAPI.syncCompanies({ _id: company._id }));
    } catch (err) {
      const wrappedError = new RestError(500, { message: err.toString() });

      throw err instanceof RestError ? err : wrappedError;
    }
  },
  async update(req, res) {
    const {
      mock, shouldMockSiSyncFail, shouldMockSiDisabled, mockServerTime,
    } = req.flags;
    const user = requestUtils.getUserFromSession(req);
    const bucket = chooseProperBucket(configuration);
    const companyAPI = new CompanyAPI(req.$logger, { bucket, user, mock });
    const siAPI = new SiConnectorAPI({
      mock,
      shouldMockSiSyncFail,
      shouldMockSiDisabled,
      mockServerTime,
    });
    const company = _.get(req, 'swagger.params.data.value');

    try {
      const companyUpdated = await companyAPI.update(company);
      return sendResponse(res, 200, { company: companyUpdated })
        .then(() => siAPI.syncCompanies({ _id: companyUpdated._id }));
    } catch (err) {
      const message = _.get(err, 'message', err);

      req.$logger.error(`Error updating company. Error: ${message}`);
      return sendErrorResponse(res, 500, { message }, false);
    }
  },
  async getCompanyBalance(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new CompanyAPI(req.$logger, { user });
    const id = _.get(req, 'swagger.params.id.value');

    try {
      const balance = await api.getCompanyBalance(id);
      return sendResponse(res, 200, balance);
    } catch (err) {
      const message = _.get(err, 'message', err);

      req.$logger.error(`Failed to retrieve company balance. Error: ${message}`);
      return sendErrorResponse(res, 500, { message }, false);
    }
  },
  async getCompanySsoSettings(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new CompanyAPI(req.$logger, { user });
    const id = _.get(req, 'swagger.params.id.value');
    try {
      const ssoSettings = await api.getCompanySsoSettings(id);
      return sendResponse(res, 200, ssoSettings);
    } catch (err) {
      const message = _.get(err, 'message', err);
      req.$logger.error(`Failed to retrieve sso settings. Error: ${message}`);
      return sendErrorResponse(res, 500, { message }, false);
    }
  },
  async getIndustry(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const companyId = _.get(req, 'swagger.params.id.value');
    try {
      const bucket = chooseProperBucket(configuration);
      const companyAPI = new CompanyAPI(req.$logger, { bucket, user });
      const company = await companyAPI.getIndustry(companyId);
      return sendResponse(res, 200, company);
    } catch (err) {
      const message = _.get(err, 'message', err);
      req.$logger.error(`Failed to retrieve company's industry. Error: ${message}`);
      return sendErrorResponse(res, 500, { message }, false);
    }
  },
};
