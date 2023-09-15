const _ = require('lodash');
const { getUserFromSession } = require('../../../utils/request');
const { pipeWithErrors } = require('../../../utils/stream');
const PaginableApiDecorator = require('../../../utils/pagination/paginable-api-decorator');
const { sendResponse, fileContentDisposition } = require('../../../components/api-response');
const BankAccountApi = require('./bank-account-api');

module.exports = {
  async list(req, res) {
    const api = new BankAccountApi(req.$logger, { user: getUserFromSession(req) });
    const list = await new PaginableApiDecorator(api, req).list({
      __tz: _.get(req.headers, 'lms-tz', 0),
    });
    sendResponse(res, 200, list);
  },
  async export(req, res) {
    const api = new BankAccountApi(req.$logger, { user: getUserFromSession(req) });
    const csvStream = await new PaginableApiDecorator(api, req, { listMethod: 'export' }).list({
      __tz: _.get(req.headers, 'lms-tz', 0),
    });
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },
  async details(req, res) {
    const api = new BankAccountApi(req.$logger, { user: getUserFromSession(req) });
    const account = await api.findById(_.get(req, 'swagger.params.id.value'));
    sendResponse(res, 200, { account });
  },
  async create(req, res) {
    const api = new BankAccountApi(req.$logger, { user: getUserFromSession(req) });
    const account = await api.create(_.get(req, 'swagger.params.data.value'));
    sendResponse(res, 200, { account });
  },
  async update(req, res) {
    const data = _.get(req, 'swagger.params.data.value');
    const id = _.get(req, 'swagger.params.id.value');
    const api = new BankAccountApi(req.$logger, { user: getUserFromSession(req) });
    const account = await api.update(id, data);
    sendResponse(res, 200, { account });
  },
};
