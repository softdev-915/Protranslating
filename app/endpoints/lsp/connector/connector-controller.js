const _ = require('lodash');
const requestUtils = require('../../../utils/request');
const ConnectorApi = require('./connector-api');
const { pipeWithErrors } = require('../../../utils/stream');
const PaginableApiDecorator = require('../../../utils/pagination/paginable-api-decorator');
const {
  sendResponse,
  fileContentDisposition,
} = require('../../../components/api-response');
const SiConnectorAPI = require('../../../connectors/si/si-connector-api');
const apiResponse = require('../../../components/api-response');

const { RestError } = apiResponse;

module.exports = {
  async export(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new ConnectorApi(req.$logger, { user });
    const __tz = _.get(req.headers, 'lms-tz', '0');
    const filters = { __tz };
    const paginableApiDecorator = new PaginableApiDecorator(api, req,
      { listMethod: 'export' });
    const csvStream = await paginableApiDecorator.list(filters);
    res.setHeader('Content-Disposition', fileContentDisposition(`${csvStream.__filename}.csv`));
    res.setHeader('Content-type', 'text/csv');
    pipeWithErrors(csvStream, res);
  },

  async list(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new ConnectorApi(req.$logger, { user });
    const __tz = _.get(req.headers, 'lms-tz', '0');
    const filters = { __tz };
    const paginableApiDecorator = new PaginableApiDecorator(api, req);
    const list = await paginableApiDecorator.list(filters);
    return sendResponse(res, 200, list);
  },

  async details(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new ConnectorApi(req.$logger, { user });
    const connectorId = _.get(req, 'swagger.params.connectorId.value');
    const connector = await api.findOne(connectorId);
    const payloads = await api.getPayloads(connector);
    return sendResponse(res, 200, { connector, payloads });
  },

  async downloadPayload(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new ConnectorApi(req.$logger, { user });
    const connectorId = _.get(req, 'swagger.params.connectorId.value');
    const connector = await api.findOne(connectorId);
    const payloadName = _.get(req, 'swagger.params.payloadName.value');
    const fileStream = await api.getPayloadStream({ connectorName: connector.name, payloadName });
    res.setHeader('Content-Disposition', fileContentDisposition(payloadName));
    res.setHeader('Content-type', 'text/xml');
    pipeWithErrors(fileStream, res);
  },

  async update(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new ConnectorApi(req.$logger, { user });
    const connector = _.get(req, 'swagger.params.data.value');
    const connectorId = _.get(req, 'swagger.params.connectorId.value');

    connector._id = connectorId;
    const connectorUpdated = await api.update(connector);
    return sendResponse(res, 200, { connector: connectorUpdated });
  },

  async testConnectivity(req, res) {
    const user = requestUtils.getUserFromSession(req);
    const api = new ConnectorApi(req.$logger, { user });
    const shouldMockSiAuthFail = _.get(req, 'query.shouldMockSiAuthFail') === 'true';
    const flags = { ...req.flags, shouldMockSiAuthFail };
    await api.testConnectivity(flags);
    return sendResponse(res, 200, { message: 'Authorization to the remote endpoint was successful' });
  },

  async getPayloadForEntity(req, res) {
    const api = new SiConnectorAPI({ ...req.flags, shouldGetPayloadWithoutSync: true });
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const entityName = _.get(req, 'swagger.params.entityName.value', '');
    const entityId = _.get(req, 'swagger.params.entityId.value', '');
    try {
      const payload = await api.getPayloadForEntity(lspId, entityName, entityId);
      return sendResponse(res, 200, payload);
    } catch (err) {
      if (!(err instanceof RestError)) {
        throw new RestError(500, { message: err.toString() });
      }
      throw err;
    }
  },

  async syncAllRecordsFromEntity(req, res) {
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const entity = _.get(req, 'swagger.params.data.value.entity', '');
    const api = new SiConnectorAPI({ ...req.flags });
    return sendResponse(res, 200, `The scheduler has started the synchronization process for all unsynchronized records for the ${entity} entity`)
      .then(() => {
        api.syncAllRecordsFromEntity(lspId, entity);
      });
  },

  async syncEntity(req, res) {
    const lspId = _.get(req, 'swagger.params.lspId.value');
    const entity = _.get(req, 'swagger.params.data.value.entity', '');
    const entityId = _.get(req, 'swagger.params.data.value.entityId', '');
    try {
      const api = new SiConnectorAPI({ ...req.flags });
      await api.syncSingleEntity(lspId, { entity, entityId });
    } catch (err) {
      req.$logger.error(`Failed to sync entity ${entity} with id ${entityId}. Error: ${err}`);
      throw new RestError(500, { message: err.toString() });
    }
    return sendResponse(res, 200, {
      message: `Entity ${entity} with id: ${entityId} successfully synced`,
    });
  },
};
