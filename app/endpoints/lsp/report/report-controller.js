const _ = require('lodash');
const { RestError, streamFile } = require('../../../components/api-response');
const requestUtils = require('../../../utils/request');
const configuration = require('../../../components/configuration');
const ReportAPI = require('./report-api');

module.exports = {
  async createPdfReport(req, res) {
    const compiledTemplate = _.get(req, 'swagger.params.data.value.compiledTemplate');
    const reportCss = _.get(req, 'swagger.params.data.value.reportCss');
    const filename = _.get(req, 'swagger.params.data.value.filename');
    const fullFilename = `${filename}.pdf`;
    const user = requestUtils.getUserFromSession(req);
    const reportApi = new ReportAPI(req.$logger, {
      user,
      configuration,
      origin: req.headers.origin,
    });
    try {
      const fileReadStream = await reportApi.generatePdfReport(compiledTemplate, reportCss);
      const file = { fileReadStream, filename: fullFilename };
      streamFile(res, file, { contentType: 'application/pdf' });
    } catch (err) {
      const message = err.message || err;
      req.$logger.error(`An error occurred while generating request's quote pdf report. Error: ${message}`);
      throw new RestError(500, { message, stack: err.stack });
    }
  },
};
