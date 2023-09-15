const _ = require('lodash');
const EpoAPI = require('./api');
const EpoCountryAPI = require('./api-country');
const EpoTranslationFeeAPI = require('./api-translation-fee');
const EpoDisclaimerAPI = require('./api-disclaimer');
const apiResponse = require('../../../../components/api-response');
const requestUtils = require('../../../../utils/request');
const PaginableAPIDecorator = require('../../../../utils/pagination/paginable-api-decorator');
const { chooseProperBucket } = require('../../../../components/aws/mock-bucket');
const { extractUserIp } = require('../../../../utils/request');
const configuration = require('../../../../components/configuration');
const RequestAPI = require('../../request/request-api');
const TemplateApi = require('../../template/template-api');
const IpApi = require('../ip-api');
const CompanyAPI = require('../../company/company-api');

const { sendResponse, RestError } = apiResponse;
const TRANSLATION_ONLY_TEMPLATE_NAME = '[#22] BIGIP_EP_TranslationOnly';
const FILLING_TEMPLATE_NAME = '[#23] BIGIP_EP_TranslationAndFiling';
const EMAIL_TEMPLATE = 'Email Template BIG';
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
  async list(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const __tz = _.get(req.headers, 'lms-tz', '0');
    const pctReference = _.get(req, 'swagger.params.pctReference.value', '');
    const patentPublicationNumber = _.get(req, 'swagger.params.patentPublicationNumber.value', '');
    const filters = { __tz };
    if (!_.isEmpty(pctReference)) {
      filters.pctReference = pctReference;
    }
    if (!_.isEmpty(patentPublicationNumber)) {
      filters.patentPublicationNumber = patentPublicationNumber;
    }
    try {
      const epoAPI = new EpoAPI(req.$logger, { user });
      const paginableApiDecorator = new PaginableAPIDecorator(epoAPI, req);
      const epo = await paginableApiDecorator.list(filters);
      if (!_.isEmpty(pctReference) || !_.isEmpty(patentPublicationNumber)) {
        const list = _.get(epo, 'list', '');
        if (!_.isEmpty(list)) {
          return sendResponse(res, 200, { epo: list[0] });
        }
        const number = _.defaultTo(pctReference, patentPublicationNumber);
        throw new RestError(404, { message: `EPO ${number} does not exist` });
      } else {
        return sendResponse(res, 200, epo);
      }
    } catch (err) {
      const wrappedError = new RestError(500, { message: err.toString() });
      throw err instanceof RestError ? err : wrappedError;
    }
  },
  async findByPatentNumber(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const patentNumber = _.get(req, 'swagger.params.epoPatentNumber.value');
    try {
      const epoAPI = new EpoAPI(req.$logger, { user });
      const epo = await epoAPI.findByPatentNumber(patentNumber);
      if (_.isNil(epo)) {
        req.$logger.error(`Epo with patent number ${patentNumber} does not exist}`);
        throw new RestError(404, { message: 'Patent number not found' });
      }
      return sendResponse(res, 200, { epo });
    } catch (err) {
      const wrappedError = new RestError(500, { message: err.toString() });
      throw err instanceof RestError ? err : wrappedError;
    }
  },
  async listCountries(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const __tz = _.get(req.headers, 'lms-tz', '0');
    const filters = { __tz };
    try {
      const epoCountryAPI = new EpoCountryAPI(req.$logger, { user });
      const paginableApiDecorator = new PaginableAPIDecorator(epoCountryAPI, req);
      const epoCountries = await paginableApiDecorator.list(filters);
      return sendResponse(res, 200, epoCountries);
    } catch (err) {
      const wrappedError = new RestError(500, { message: err.toString() });
      throw err instanceof RestError ? err : wrappedError;
    }
  },
  async listCurrencies(req, res) {
    const user = requestUtils.getUserFromSession(req);
    try {
      const defaultCurrencyIsoCode = 'EUR';
      const ipApi = new IpApi(req.$logger, { user, configuration, defaultCurrencyIsoCode });
      const currencyList = await ipApi.listCurrencies();
      return sendResponse(res, 200, currencyList);
    } catch (err) {
      const wrappedError = new RestError(500, { message: err.toString() });
      throw err instanceof RestError ? err : wrappedError;
    }
  },
  async listTranslationFee(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const filters = {
      __tz: _.get(req.headers, 'lms-tz', '0'),
      epoId: _.get(req, 'swagger.params.epoId.value', null),
      countries: _.get(req, 'swagger.params.countries.value', null),
      descriptionWordCount: _.get(req, 'swagger.params.descriptionWordCount.value', null),
      claimsWordCount: _.get(req, 'swagger.params.claimWordCount.value', null),
      drawingsWordCount: _.get(req, 'swagger.params.drawingsWordCount.value', null),
      drawingsPageCount: _.get(req, 'swagger.params.drawingsPageCount.value', null),
      descriptionPageCount: _.get(req, 'swagger.params.descriptionPageCount.value', null),
      claimsPageCount: _.get(req, 'swagger.params.claimsPageCount.value', null),
      numberOfClaims: _.get(req, 'swagger.params.numberOfClaims.value', null),
      applicantCount: _.get(req, 'swagger.params.applicantCount.value', null),
      translationOnly: _.get(req, 'swagger.params.translationOnly.value', null),
      otherLanguages: _.get(req, 'swagger.params.otherLanguages.value', null),
      hasClaimsTranslationOccurred: _.get(req, 'swagger.params.hasClaimsTranslationOccurred.value', null),
      claimsTranslationFeesTotal: _.get(req, 'swagger.params.claimsTranslationFeesTotal.value', null),
    };
    try {
      const epoTranslationFeeAPI = new EpoTranslationFeeAPI(req.$logger, { user });
      const paginableApiDecorator = new PaginableAPIDecorator(epoTranslationFeeAPI, req);
      const sourceLanguage = await epoTranslationFeeAPI.getPatentSourceLanguage(filters.epoId);
      const companyAPI = new CompanyAPI(req.$logger, { user });
      const userCompanyId = _.get(user, 'company._id', null);
      const { defaultCompanyCurrencyCode, entityIpRates } = await companyAPI.getIpRates(
        userCompanyId, 'epo', sourceLanguage,
      );
      filters.companyIpRates = _.defaultTo(entityIpRates, []);
      filters.defaultCompanyCurrencyCode = defaultCompanyCurrencyCode;
      const epoTranslationFees = await paginableApiDecorator.list(filters);
      return sendResponse(res, 200, epoTranslationFees);
    } catch (err) {
      const wrappedError = new RestError(500, { message: err.toString() });
      throw err instanceof RestError ? err : wrappedError;
    }
  },
  async listClaimsTranslationFee(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const filters = {
      __tz: _.get(req.headers, 'lms-tz', '0'),
      epoId: _.get(req, 'swagger.params.epoId.value', null),
      claimsWordCount: _.get(req, 'swagger.params.claimsWordCount.value', null),
      otherLanguages: _.get(req, 'swagger.params.otherLanguages.value', null),
    };
    try {
      const epoTranslationFeeAPI = new EpoTranslationFeeAPI(req.$logger, { user });
      const companyAPI = new CompanyAPI(req.$logger, { user });
      const sourceLanguage = await epoTranslationFeeAPI.getPatentSourceLanguage(filters.epoId);
      const userCompanyId = _.get(user, 'company._id', null);
      const { defaultCompanyCurrencyCode } = await companyAPI.getIpRates(
        userCompanyId, 'epo', sourceLanguage,
      );
      filters.defaultCompanyCurrencyCode = defaultCompanyCurrencyCode;
      const epoClaimsTranslationFees = await epoTranslationFeeAPI
        .listClaimsTranslationFees(filters);
      return sendResponse(res, 200, epoClaimsTranslationFees);
    } catch (err) {
      const wrappedError = new RestError(500, { message: err.toString() });
      throw err instanceof RestError ? err : wrappedError;
    }
  },
  async listDisclaimer(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const filters = {
      __tz: _.get(req.headers, 'lms-tz', '0'),
      countries: _.get(req, 'swagger.params.countries.value', null),
      translationOnly: _.get(req, 'swagger.params.translationOnly.value', false),
    };
    try {
      const epoDisclaimerApi = new EpoDisclaimerAPI(req.$logger, { user });
      const paginableApiDecorator = new PaginableAPIDecorator(epoDisclaimerApi, req);
      const epoDisclaimers = await paginableApiDecorator.list(filters);
      return sendResponse(res, 200, epoDisclaimers);
    } catch (err) {
      const wrappedError = new RestError(500, { message: err.toString() });
      throw err instanceof RestError ? err : wrappedError;
    }
  },
  async getTemplate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const translationOnly = _.get(req, 'swagger.params.translationOnly.value', false);
    const epoApi = new EpoAPI(req.$logger, {
      user,
    });
    const template = await epoApi.getTemplate(translationOnly);
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
        },
      );
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
      await requestApi.recalculateEpoFee(request, originalRequest, translationOnly);
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
