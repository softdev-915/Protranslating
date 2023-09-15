const _ = require('lodash');
const NodbCountryAPI = require('./api-country');
const NodbTranslationFeeAPI = require('./api-translation-fee');
const NodbTranslationFeeFilingAPI = require('./api-translation-fee-filing');
const IPDisclaimerAPI = require('./api-disclaimer');
const TemplateApi = require('../../template/template-api');
const apiResponse = require('../../../../components/api-response');
const requestUtils = require('../../../../utils/request');
const { chooseProperBucket } = require('../../../../components/aws/mock-bucket');
const { extractUserIp } = require('../../../../utils/request');
const PaginableAPIDecorator = require('../../../../utils/pagination/paginable-api-decorator');
const configuration = require('../../../../components/configuration');
const RequestAPI = require('../../request/request-api');
const IpApi = require('../ip-api');
const CompanyAPI = require('../../company/company-api');

const TRANSLATION_ONLY_TEMPLATE_NAME = '[#24] BIGIP_DirectFiling_TranslationOnly';
const FILLING_TEMPLATE_NAME = '[#25] BIGIP_DirectFiling_TranslationAndFiling';
const EMAIL_TEMPLATE = 'Requesting Customized Quote Email Template';
const { sendResponse, RestError } = apiResponse;
const findTemplates = (templates) => {
  const templatesFound = [];
  _.forEach(templates, (t) => {
    if (t.name === TRANSLATION_ONLY_TEMPLATE_NAME || t.name === FILLING_TEMPLATE_NAME) {
      templatesFound[0] = t;
    } else if (t.name === EMAIL_TEMPLATE) templatesFound[1] = t;
  });
  return templatesFound;
};

module.exports = {
  async listCountries(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const nodbCountryAPI = new NodbCountryAPI(req.$logger, { user });
    const paginableApiDecorator = new PaginableAPIDecorator(
      nodbCountryAPI,
      req,
    );
    const nodbCountries = await paginableApiDecorator.list(filters);
    return sendResponse(res, 200, nodbCountries);
  },
  async listCurrencies(req, res) {
    const user = requestUtils.getUserFromSession(req);
    try {
      const defaultCurrencyIsoCode = 'USD';
      const ipApi = new IpApi(req.$logger, { user, configuration, defaultCurrencyIsoCode });
      const currencyList = await ipApi.listCurrencies();
      return sendResponse(res, 200, currencyList);
    } catch (err) {
      const wrappedError = new RestError(500, { message: err.toString() });
      throw err instanceof RestError ? err : wrappedError;
    }
  },
  async listDisclaimers(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const ipDisclaimerAPI = new IPDisclaimerAPI(req.$logger, {
      user,
    });
    const paginableApiDecorator = new PaginableAPIDecorator(
      ipDisclaimerAPI,
      req,
    );
    const ipDisclaimers = await paginableApiDecorator.list(filters);
    return sendResponse(res, 200, ipDisclaimers);
  },
  async listTranslationFee(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
      countries: _.get(req, 'swagger.params.countries.value'),
      specificationWordCount: _.get(req, 'swagger.params.specificationWordCount.value'),
      drawingsWordCount: _.get(req, 'swagger.params.drawingsWordCount.value'),
      numberOfDrawings: _.get(req, 'swagger.params.numberOfDrawings.value'),
      drawingsPageCount: _.get(req, 'swagger.params.drawingsPageCount.value'),
    };
    const nodbTranslationFeeAPI = new NodbTranslationFeeAPI(req.$logger, { user });
    const paginableApiDecorator = new PaginableAPIDecorator(nodbTranslationFeeAPI, req);
    const companyAPI = new CompanyAPI(req.$logger, { user });
    const userCompanyId = _.get(user, 'company._id', null);
    const companyId = _.get(req, 'swagger.params.companyId.value', userCompanyId);

    if (!_.isNil(companyId)) {
      const { defaultCompanyCurrencyCode, entityIpRates } = await companyAPI.getIpRates(companyId, 'nodb', 'en');
      filters.companyIpRates = _.defaultTo(entityIpRates, []);
      filters.defaultCompanyCurrencyCode = defaultCompanyCurrencyCode;
    }
    const nodbTranslationFees = await paginableApiDecorator.list(filters);
    return sendResponse(res, 200, nodbTranslationFees);
  },

  async listTranslationFeeFiling(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
      entities: _.get(req, 'swagger.params.entities.value', null),
      countries: _.get(req, 'swagger.params.countries.value', null),
      specificationWordCount: _.get(req, 'swagger.params.specificationWordCount.value'),
      drawingsWordCount: _.get(req, 'swagger.params.drawingsWordCount.value'),
      numberOfDrawings: _.get(req, 'swagger.params.numberOfDrawings.value'),
      totalNumberOfPages: _.get(req, 'swagger.params.totalNumberOfPages.value'),
      numberOfIndependentClaims: _.get(req, 'swagger.params.numberOfIndependentClaims.value'),
      numberOfClaims: _.get(req, 'swagger.params.numberOfClaims.value'),
      applicantsLength: _.get(req, 'swagger.params.applicantsLength.value'),
    };

    try {
      const userCompanyId = _.get(user, 'company._id', null);
      const companyId = _.get(req, 'swagger.params.companyId.value', userCompanyId);
      const nodbTranslationFeeAPI = new NodbTranslationFeeFilingAPI(req.$logger, { user });
      const paginableApiDecorator = new PaginableAPIDecorator(nodbTranslationFeeAPI, req);
      if (!_.isNil(companyId)) {
        const companyAPI = new CompanyAPI(req.$logger, { user });
        const { defaultCompanyCurrencyCode, entityIpRates } = await companyAPI.getIpRates(companyId, 'nodb', 'en');
        filters.companyIpRates = _.defaultTo(entityIpRates, []);
        filters.defaultCompanyCurrencyCode = defaultCompanyCurrencyCode;
      }
      const nodbTranslationFees = await paginableApiDecorator.list(filters);
      return sendResponse(res, 200, nodbTranslationFees);
    } catch (error) {
      req.$logger.error(_.get(error, 'message', error));
    }
  },
  async getTemplate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const translationOnly = _.get(req, 'swagger.params.translationOnly.value', false);
    const nodbTranslationFeeAPI = new NodbTranslationFeeAPI(req.$logger, {
      user,
    });
    const template = await nodbTranslationFeeAPI.getTemplate(translationOnly);
    return sendResponse(res, 200, { template });
  },
  async createRequest(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const newTranslationRequest = _.get(req, 'swagger.params.data.value');
    const translationOnly = _.get(req, 'swagger.params.translationOnly.value');
    const bucket = chooseProperBucket(configuration);
    const clientIP = extractUserIp(req);
    const requestApi = new RequestAPI({
      user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
      bucket,
    });
    const templateApi = new TemplateApi(req.$logger, { user, configuration });
    let createdTranslationRequest = await requestApi.create(newTranslationRequest, clientIP);
    if (newTranslationRequest.requireQuotation) {
      const quoteTemplateName = translationOnly
        ? TRANSLATION_ONLY_TEMPLATE_NAME : FILLING_TEMPLATE_NAME;
      const templates = await templateApi.retrieveByNames([
        quoteTemplateName, EMAIL_TEMPLATE,
      ]);
      const [quoteTemplate, emailTemplate] = findTemplates(templates);
      if (!quoteTemplate) {
        throw new RestError(404, { message: `The Quote Template ${quoteTemplateName} is not found` });
      } else if (!emailTemplate) {
        throw new RestError(404, { message: `The Email Template ${emailTemplate} is not found` });
      }
      createdTranslationRequest = await requestApi.saveRequestQuoteData(
        createdTranslationRequest._id,
        {
          quoteTemplateId: quoteTemplate._id,
          emailTemplateId: emailTemplate._id,
        });
    }
    return sendResponse(res, 200, { request: createdTranslationRequest });
  },
  async updateRequest(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const request = _.get(req, 'swagger.params.data.value');
    const bucket = chooseProperBucket(configuration);
    const requestApi = new RequestAPI({
      user,
      configuration,
      log: req.$logger,
      mock: req.flags.mock,
      mockServerTime: req.flags.mockServerTime,
      bucket,
    });
    const translationOnly = _.get(req, 'swagger.params.translationOnly.value');
    try {
      const requestId = _.get(request, '_id', '');
      const isQuoteApproved = _.get(request, 'isQuoteApproved', false);
      const originalRequest = await requestApi.findOne(requestId);
      await requestApi.recalculateNoDbFee(request, originalRequest, translationOnly);
      await requestApi.updateIpRequestStatus(request, originalRequest);
      await requestApi.edit(user, request);
      if (isQuoteApproved) {
        await requestApi.approveQuote(requestId);
      }
      const editedRequest = await requestApi.findOne(requestId);
      return sendResponse(res, 200, { request: editedRequest });
    } catch (err) {
      const message = _.get(err, 'message', err);
      const code = _.get(err, 'code', 500);
      const requestReadAgain = await requestApi.findOne(request._id);
      throw new RestError(code, {
        data: requestReadAgain,
        message: `Error updating request: ${message}. ${_.get(err, 'stack', '')}`,
        stack: _.get(err, 'stack', ''),
      });
    }
  },
};
