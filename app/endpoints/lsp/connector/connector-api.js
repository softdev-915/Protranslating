const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');
const { validObjectId } = require('../../../utils/schema');
const { RestError } = require('../../../components/api-response');
const siConnector = require('../../../connectors/si');
const SiConnectorAPI = require('../../../connectors/si/si-connector-api');
const pathToPayloadByConnectorName = require('../../../connectors/connector-payload-path-config');
const {
  doesFileExist, isFile, isDirectory, readFiles,
} = require('../../../utils/file');

const CONNECTOR_DIR = path.resolve(__dirname, '../../../connectors');

class ConnectorApi extends SchemaAwareAPI {
  _getQueryFilters(filters) {
    const { lspId } = this;
    const query = { lspId, ..._.get(filters, 'paginationParams', {}) };
    return { query };
  }

  async findOne(_id) {
    const { lspId } = this;
    const query = { _id, lspId };

    if (!validObjectId(_id)) {
      throw new RestError(400, { message: `Invalid connector id ${_id}` });
    }
    const connector = await this.schema.Connector.findOneWithDeleted(query);

    if (!connector) {
      throw new RestError(404, { message: `Connector with id: ${_id} was not found` });
    }
    return connector;
  }

  async update(connector) {
    const { _id } = connector;
    const connectorInDb = await this.findOne(_id);
    const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(
      this.user,
      this.logger,
      { entityName: 'connector' },
    );
    await concurrencyReadDateChecker.failIfOldEntity(connectorInDb);
    connectorInDb.safeAssign(connector);
    const updatedConnector = await this.schema.Connector
      .findOneAndUpdateWithDeleted({ _id: connectorInDb._id }, { $set: connectorInDb }, { new: true });

    await siConnector.deleteToken(this.lspId);
    return updatedConnector;
  }

  async list(filters) {
    let list = [];
    const { query } = this._getQueryFilters(filters);

    try {
      list = await this.schema.Connector.gridAggregation().exec({
        filters: query,
        utcOffsetInMinutes: filters.__tz,
      });
    } catch (e) {
      this.logger.error(`Error while performing Connector aggregation. Error: ${e}`);
      throw new RestError(500, e);
    }
    return { list, total: list.length };
  }

  async export(filters) {
    let csvStream;
    const { query } = this._getQueryFilters(filters);

    try {
      csvStream = this.schema.Connector.gridAggregation().csvStream({
        filters: query,
        utcOffsetInMinutes: filters.__tz,
        shouldPaginate: false,
      });
    } catch (e) {
      this.logger.error(`Error transforming to csv. Error: ${e}`);
      throw new RestError(500, e);
    }
    return csvStream;
  }

  async getPayloadStream({ connectorName, payloadName }) {
    let payloadPath = _.get(pathToPayloadByConnectorName, connectorName);

    if (_.isNil(payloadPath)) {
      throw new RestError(404, { message: `Payload path for connector: ${connectorName} was not found` });
    }
    payloadPath = path.resolve(CONNECTOR_DIR, payloadPath, payloadName);
    const doesPayloadFileExist = await doesFileExist(payloadPath);
    const isTypeFile = await isFile(payloadPath);

    if (!(isTypeFile && doesPayloadFileExist)) {
      throw new RestError(404, { message: `Payload file: ${payloadName} was not found` });
    }
    return fs.createReadStream(payloadPath);
  }

  async getPayloads(connector) {
    let payloads = [];
    const connectorName = _.get(connector, 'name');
    let payloadPath = _.get(pathToPayloadByConnectorName, connectorName);

    if (!_.isNil(payloadPath)) {
      payloadPath = path.resolve(CONNECTOR_DIR, payloadPath);
      const isTypeDirectory = await isDirectory(payloadPath);

      if (isTypeDirectory) {
        payloads = await readFiles(payloadPath);
      }
    }
    return payloads;
  }

  async testConnectivity(flags) {
    try {
      const siAPI = new SiConnectorAPI(flags);

      await siAPI.testConnectivity(this.lspId);
    } catch (e) {
      this.logger.error(`Error while testing connectivity: ${e}`);
      throw new RestError(503, e);
    }
  }
}

module.exports = ConnectorApi;
