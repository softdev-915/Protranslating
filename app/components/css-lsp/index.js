const _ = require('lodash');
const { request } = require('undici');
const parser = require('xml2json');

const VALIDATION_URL = 'http://jigsaw.w3.org/css-validator/validator';
const W3C_VALIDATION_OUTPUT = 'soap12';
const cssValidityPath = 'env:Envelope.env:Body.m:cssvalidationresponse.m:validity';
const cssErrorsPath = 'env:Envelope.env:Body.m:cssvalidationresponse.m:result.m:errors';
const createValidationUrl = (cssUri, options) => {
  let optionsQueryParams = '';

  _.forIn(options, (optionValue, optionKey) => {
    optionsQueryParams += `&${optionKey}=${optionValue}`;
  });

  return `${VALIDATION_URL}?uri=${cssUri}${optionsQueryParams}`;
};

class CssLsp {
  constructor(cssUri, logger, options) {
    this.options = _.assign({
      output: W3C_VALIDATION_OUTPUT,
    }, options);
    this.cssUri = cssUri;
    this.logger = logger;
  }

  async validate() {
    const validationUrl = createValidationUrl(this.cssUri, this.options);
    let soapResponse = '';

    try {
      const { body } = await request(validationUrl);

      soapResponse = await body.json();
    } catch (err) {
      this.logger.error(`Css validation failed ${err.message}`);
    }
    const responseJson = parser.toJson(soapResponse, { object: true });
    const isValid = _.get(responseJson, cssValidityPath, false);

    if (isValid === 'false') {
      const cssValidationError = _.get(responseJson, `${cssErrorsPath}.m:errorlist.m:error`);
      let errorMessage = '';

      if (_.isArray(cssValidationError)) {
        const errorMessagedArray = _.map(
          cssValidationError,
          (cssValErrorItem) => _.get(cssValErrorItem, 'm:message', ''),
        );

        errorMessage = _.join(errorMessagedArray, ',');
      } else {
        errorMessage = cssValidationError['m:message'];
      }
      throw Error(errorMessage);
    }
  }

  async getCss() {
    const cssFileContent = await request.get(this.cssUri);

    return cssFileContent;
  }
}

module.exports = CssLsp;
