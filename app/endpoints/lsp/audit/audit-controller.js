const _ = require('lodash');
const { getUserFromSession } = require('../../../utils/request');
const { sendResponse, streamFile } = require('../../../components/api-response');
const configuration = require('../../../components/configuration');
const AuditAPI = require('./audit-api');
const PaginableAPIDecorator = require('../../../utils/pagination/paginable-api-decorator');

module.exports = {
  async auditExport(req, res) {
    const user = getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const api = new AuditAPI(req.$logger, { configuration, lspId, mock: req.flags.mock });
    const tz = _.get(req.headers, 'lms-tz', '0');
    const filters = {
      __tz: tz,
    };
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'auditExport', req });
    const file = await paginableApiDecorator.noSchemaList(user, filters);
    streamFile(res, file);
  },
  async auditList(req, res) {
    const user = getUserFromSession(req);
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const api = new AuditAPI(req.$logger, { configuration, lspId, mock: req.flags.mock });
    const paginableApiDecorator = new PaginableAPIDecorator(api, req, { listMethod: 'auditList' });
    // NOTE: this grid should list in utc-0 as per special request
    const listData = await paginableApiDecorator.noSchemaList(user, { __tz: '0' });
    return sendResponse(res, 200, listData);
  },
};
