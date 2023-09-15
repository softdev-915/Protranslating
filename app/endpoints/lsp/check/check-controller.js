const _ = require('lodash');
const { sendResponse, fileContentDisposition } = require('../../../components/api-response');
const { getUserFromSession } = require('../../../utils/request');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');
const CheckApi = require('./check-api');

module.exports = {
  async checkList(req, res) {
    const user = getUserFromSession(req);
    const checkApi = new CheckApi(req.$logger, { user });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(checkApi, req);
    const checksList = await paginableApiDecorator.list(filters);
    sendResponse(res, 200, checksList);
  },
  async updateMemo(req, res) {
    const user = getUserFromSession(req);
    const id = _.get(req, 'swagger.params.id.value');
    const body = _.get(req, 'swagger.params.data.value');
    const checkApi = new CheckApi(req.$logger, { user });
    await checkApi.updateMemo(id, body);
    sendResponse(res, 200);
  },
  async generateChecksPdf(req, res) {
    const user = getUserFromSession(req);
    const body = _.get(req, 'swagger.params.data.value');
    const checkApi = new CheckApi(req.$logger, { user });
    const pdf = await checkApi.getChecksPdf(body);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', fileContentDisposition('generated-checks.pdf'));
    res.send(pdf);
  },
};
