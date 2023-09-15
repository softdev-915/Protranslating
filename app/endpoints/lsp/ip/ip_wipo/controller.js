const _ = require('lodash');
const WipoAPI = require('./api');
const WipoCountryAPI = require('./api-country');
const WipoTranslationFeeAPI = require('./api-translation-fee');
const IPDisclaimerAPI = require('./api-disclaimer');
const apiResponse = require('../../../../components/api-response');
const requestUtils = require('../../../../utils/request');
const { extractUserIp } = require('../../../../utils/request');
const { chooseProperBucket } = require('../../../../components/aws/mock-bucket');
const PaginableAPIDecorator = require('../../../../utils/pagination/paginable-api-decorator');
const configuration = require('../../../../components/configuration');
const RequestAPI = require('../../request/request-api');
const TemplateApi = require('../../template/template-api');
const IpApi = require('../ip-api');

const { sendResponse, RestError } = apiResponse;
const TRANSLATION_ONLY_TEMPLATE_NAME = '[#20] BIGIP_PCT_TranslationOnly';
const FILLING_TEMPLATE_NAME = '[#21] BIGIP_PCT_TranslationAndFiling';
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
    const tz = _.get(req.headers, 'lms-tz', '0');
    const pctReference = _.get(req, 'swagger.params.pctReference.value');
    const patentPublicationNumber = _.get(
      req,
      'swagger.params.patentPublicationNumber.value',
    );
    const filters = {
      __tz: tz,
    };
    if (!_.isNil(pctReference)) {
      filters.pctReference = pctReference;
    }
    if (!_.isNil(patentPublicationNumber)) {
      filters.patentPublicationNumber = patentPublicationNumber;
    }
    const wipoAPI = new WipoAPI(req.$logger, { user });
    const paginableApiDecorator = new PaginableAPIDecorator(wipoAPI, req);
    const wipo = await paginableApiDecorator.list(filters);
    if (!_.isNil(pctReference) || !_.isNil(patentPublicationNumber)) {
      if (!_.isNil(wipo) && wipo.list.length > 0) {
        return sendResponse(res, 200, {
          wipo: wipo.list[0],
        });
      }
      throw new RestError(404, {
        message: `WIPO ${
          pctReference || patentPublicationNumber
        } does not exist`,
      });
    } else {
      return sendResponse(res, 200, wipo);
    }
  },
  async listCountries(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const wipoCountryAPI = new WipoCountryAPI(req.$logger, { user });
    const paginableApiDecorator = new PaginableAPIDecorator(
      wipoCountryAPI,
      req,
    );
    const wipoCountries = await paginableApiDecorator.list(filters);
    return sendResponse(res, 200, wipoCountries);
  },
  async listTranslationFee(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
      translationOnly: _.get(req, 'swagger.params.translationOnly.value'),
      wipoId: _.get(req, 'swagger.params.wipoId.value'),
      countries: _.get(req, 'swagger.params.countries.value', [])
        .map(c => ({ name: c, shouldTranslateDirectly: true })),
      descriptionWordCount: _.get(req, 'swagger.params.descriptionWordCount.value'),
      claimsWordCount: _.get(req, 'swagger.params.claimsWordCount.value'),
      entities: _.get(req, 'swagger.params.entities.value'),
      drawingsWordCount: _.get(req, 'swagger.params.drawingsWordCount.value'),
      abstractWordCount: _.get(req, 'swagger.params.abstractWordCount.value'),
      drawingsPageCount: _.get(req, 'swagger.params.drawingsPageCount.value'),
      numberOfTotalPages: _.get(req, 'swagger.params.numberOfTotalPages.value'),
      numberOfClaims: _.get(req, 'swagger.params.numberOfClaims.value'),
      numberOfIndependentClaims: _.get(req, 'swagger.params.numberOfIndependentClaims.value'),
      numberOfDrawings: _.get(req, 'swagger.params.numberOfDrawings.value'),
      numberOfPriorityApplications: _.get(req, 'swagger.params.numberOfPriorityApplications.value'),
      companyId: _.get(user, 'company._id'),
    };
    const wipoTranslationFeeAPI = new WipoTranslationFeeAPI(req.$logger, {
      user,
    });
    const paginableApiDecorator = new PaginableAPIDecorator(
      wipoTranslationFeeAPI,
      req,
    );
    try {
      const wipoTranslationFees = await paginableApiDecorator.list(filters);
      return sendResponse(res, 200, wipoTranslationFees);
    } catch (err) {
      const wrappedError = new RestError(500, { message: err.toString() });
      throw err instanceof RestError ? err : wrappedError;
    }
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
  async getTemplate(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const translationOnly = _.get(req, 'swagger.params.translationOnly.value', false);
    const wipoApi = new WipoAPI(req.$logger, {
      user,
    });
    const template = await wipoApi.getTemplate(translationOnly);
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
      if (_.isNil(quoteTemplate)) {
        throw new RestError(404, { message: `The Quote Template ${quoteTemplateName} is not found` });
      } else if (_.isNil(emailTemplate)) {
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
      await requestApi.recalculateWipoFee(request, originalRequest, translationOnly);
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
