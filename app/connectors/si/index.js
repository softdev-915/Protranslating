const mongoose = require('mongoose');
const _ = require('lodash');
const uuid = require('uuid');
const axios = require('axios');
const moment = require('moment');
const xml2json = require('xml2json');
const { pd } = require('pretty-data');
const handlebars = require('handlebars');
const helpers = require('helpers-for-handlebars');
const loadCustomHelpers = require('../../utils/handlebars');
const loadPayloads = require('./payloads');
const BaseConnector = require('../base-connector');
const appLogger = require('../../components/log/logger');
const SiConnectorError = require('./error');
const SiConnectorTokenManager = require('./token-manager');
const { models: mongooseSchema } = require('../../components/database/mongo');
const configuration = require('../../components/configuration');

const CONNECTOR_TIMEOUT_MIN = 5;

helpers({ handlebars });
loadCustomHelpers(handlebars);

class SIConnector extends BaseConnector {
  constructor() {
    super();
    this.logger = appLogger;
    this._name = 'Sage Intacct';
    this.tokenManager = new SiConnectorTokenManager(this.generateToken.bind(this));
    this.isProd = configuration.isProd;
  }

  get logMeta() { return { label: 'si-connector' }; }

  getLspIdFromEntity(entity) {
    const lspIdField = _.get(entity, 'lspId', entity.lsp);
    const isLspIdpopulated = _.isObject(lspIdField);
    const lspId = isLspIdpopulated ? lspIdField._id : lspIdField;

    if (_.isNil(lspId)) {
      throw new Error(`Couldn't get lspId from entity ${JSON.stringify(entity)}`);
    }
    return lspId;
  }

  getSiMetadataFromResponse(response, siName) {
    if (_.has(response, `data.${siName}`)) {
      return response.data[siName];
    }
    if (!_.isNil(response.key)) {
      return { RECORDNO: response.key };
    }
  }

  async initialize() {
    this.payloadsXml = await loadPayloads();

    const countries = await mongooseSchema.Country.find({}).select('name siCountry siCode').lean();

    this.siCountriesMap = countries.reduce((agg, { name, siCountry, siCode }) => ({ ...agg, [name]: { siCountry, siCode } }), {});

    this.logger.info('[Si-connector initialized]');
  }

  async syncEntity(entity, payloads, siName) {
    const { _id } = entity;
    let siMetadata = _.get(entity, 'siConnector.metadata');

    if (_.get(entity, 'siConnector.isMocked', false)) {
      return Promise.resolve();
    }
    await this.assertEntityCanBeSynced(entity);
    if (_.isNil(siMetadata)) {
      this.logger.debug(`SIConnector: About to send payload request ${siName}. Entity Id ${_id}`);
      const response = await this.sendPayloadRequest(payloads.exist, entity);
      this.logger.debug(`SIConnector: getSiMetadataFromResponse to send payload request ${siName}. Entity Id ${_id}`);
      siMetadata = this.getSiMetadataFromResponse(response, siName);
      if (_.toNumber(response.data.count) > 1) {
        this.logger.error(`Entity is mapped to more than one record in SI. RECORDNO: ${siMetadata.map((e) => e.RECORDNO).join(', ')}`);
        throw new Error(`Entity is mapped to more than one record in SI. RECORDNO: ${siMetadata.map((e) => e.RECORDNO).join(', ')}`);
      }
    }
    if (!_.isNil(siMetadata) && _.isNil(payloads.update)) {
      this.logger.silly(`Entity ${siName} with _id ${_id} already exists in the SI and cannot be updated`, this.logMeta);
      return siMetadata;
    }
    const syncPayloadName = _.isNil(siMetadata) ? payloads.create : payloads.update;

    entity.recordNo = _.get(siMetadata, 'RECORDNO');
    this.logger.debug(`SIConnector: About to send payload request ${syncPayloadName}. Entity Id ${_id}, recordNo ${entity.recordNo}`);
    const response = await this.sendPayloadRequest(syncPayloadName, entity);
    return this.getSiMetadataFromResponse(response, siName);
  }

  async buildQueryForNotSyncedEntities(lspId, isMocked) {
    const connectorEntity = await this.getConnectorByLspId(lspId);
    const query = {
      $and: [
        {
          $or: [
            { lspId },
            { lsp: lspId },
          ],
        },
        {
          $or: [
            {
              'siConnector.isSynced': false,
              'siConnector.connectorStartedAt': {
                $lte: moment().utc().subtract(CONNECTOR_TIMEOUT_MIN, 'minutes').toDate(),
              },
            },
            {
              'siConnector.isSynced': false,
              'siConnector.connectorStartedAt': { $exists: false },
            },
            {
              'siConnector.error': { $ne: null },
            },
            {
              siConnector: { $exists: false },
            },
            {
              'siConnector.connectorEndedAt': { $exists: true },
              $expr: {
                $gt: [
                  '$updatedAt',
                  '$siConnector.connectorEndedAt',
                ],
              },
            },
          ],
        },
      ],
      updatedAt: { $gte: connectorEntity.syncFromDate },
    };
    if (!this.isProd) {
      const mockStatus = isMocked || { $ne: true };
      query.$and.push({ 'siConnector.isMocked': mockStatus });
    }
    this.logger.debug('SIConnector: Returning query to get unsynced records');
    return query;
  }

  async sendPayloadRequest(payloadName, entity) {
    const lspId = this.getLspIdFromEntity(entity);
    this.logger.debug(`SIConnector: Sending ${payloadName} payload request from lspId ${lspId}`);
    try {
      const context = await this._prepareContext(entity);
      const data = this._populateTemplate(payloadName, context);
      this.logger.debug(`SIConnector: Finished payload parsing for ${payloadName}. LspId ${lspId}`);
      return await this.getRequestResult(context.endpoint, data, payloadName);
    } catch (e) {
      this.logger.error(`SIConnector: Failed to send SI request: ${e}. LspId ${lspId}`);
      const status = _.get(e, 'response.status');

      if (e.isAxiosError && status === 401) {
        await this.tokenManager.refreshToken(lspId);
        const context = await this._prepareContext(entity);
        const data = this._populateTemplate(payloadName, context);
        return this.getRequestResult(context.endpoint, data, payloadName);
      }
      if (e.isAxiosError && status === 429) {
        this.logger.error(`SIConnector: 'Too many requests to SI connector. The entity will be synced later on by the scheduler ${lspId}`);
        throw new Error('Too many requests to SI connector. The entity will be synced later on by the scheduler');
      }
      throw e;
    }
  }

  async _prepareContext(entity) {
    const { siCountriesMap } = this;
    const lspId = this.getLspIdFromEntity(entity);
    const guid = _.get(entity, '_id', uuid.v4());
    const timestamp = moment().unix();
    const token = await this.tokenManager.getToken(lspId);
    const { senderId, senderPassword } = await this.getConnectorByLspId(lspId);
    return {
      senderId, senderPassword, ...entity, timestamp, guid, ...token, siCountriesMap,
    };
  }

  _populateTemplate(payloadName, context) {
    const xmlPayload = this.payloadsXml[payloadName];

    if (_.isNil(xmlPayload)) {
      throw Error(`${payloadName} is not found in payloads list`);
    }
    const compiledTemplate = handlebars.compile(xmlPayload);
    return pd.xmlmin(compiledTemplate(context));
  }

  async getCompiledPayloadByEntity(payloadName, entity) {
    const { siCountriesMap } = this;
    const lspId = this.getLspIdFromEntity(entity);
    const guid = _.get(entity, '_id', uuid.v4());
    const timestamp = moment().unix();
    const { senderId, senderPassword } = await this.getConnectorByLspId(lspId);
    const xmlPayload = this.payloadsXml[payloadName];

    if (_.isNil(xmlPayload)) {
      throw Error(`${payloadName} is not found in payloads list`);
    }
    const compiledTemplate = handlebars.compile(xmlPayload);
    return pd.xml(compiledTemplate({
      senderId,
      senderPassword,
      ...entity,
      timestamp,
      guid,
      siCountriesMap,
    }));
  }

  async generateToken(lspId) {
    const { name } = this;
    const connectorInDb = await this.getConnectorByLspId(lspId);
    const {
      username: userId, password: userPassword,
      senderId, companyId, senderPassword, remoteUrl,
    } = connectorInDb;

    if (connectorInDb.deleted) {
      throw new Error(`SI connector for lsp ${lspId} is disabled`);
    }
    const lspLocationId = await mongooseSchema.Lsp.getLocationId(lspId);
    const payloadName = 'generateApiSession';
    const data = this._populateTemplate(payloadName, {
      userId,
      userPassword,
      lspLocationId,
      senderId,
      companyId,
      senderPassword,
      guid: uuid.v4(),
      timestamp: moment().unix(),
    });
    let result;

    try {
      result = await this.getRequestResult(remoteUrl, data, payloadName);
    } catch (e) {
      if (e instanceof SiConnectorError) {
        await mongooseSchema.Connector.findOneAndUpdateWithDeleted(
          { lspId, name },
          { hasAuthError: true },
        );
      }
      throw e;
    }
    await mongooseSchema.Connector.findOneAndUpdateWithDeleted(
      { lspId, name },
      { hasAuthError: false },
    );
    const { sessionid: sessionId, endpoint } = result.data.api;
    return { sessionId, endpoint };
  }

  async testConnectivity(lspId) {
    await this.tokenManager.refreshToken(lspId);
  }

  async getRequestResult(endpoint, data, payloadName) {
    this.logger.debug(`SIConnector: getRequestResult ${endpoint}`);
    const config = {
      data,
      url: endpoint,
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
    };
    data = `${data}`.replace(/(<password>).+?(<\/password>)/, '$1*hidden*$2');
    this.logger.debug(`SIConnector ${this.name} sending a request with payload: ${data}`, this.logMeta);
    const response = await axios(config);

    this.logger.debug(`SIConnector ${this.name} got a response data: ${response.data}`, this.logMeta);
    const jsonData = JSON.parse(xml2json.toJson(response.data));
    const error = SiConnectorError.generateFromApiResponse(jsonData);
    const result = _.get(jsonData, 'response.operation.result');
    const logMessage = [
      `SIConnector ${this.name} request completed`,
      `Action: ${payloadName}`,
      `Endpoint: ${endpoint}`,
      `Entity: ${data}`,
      `Result code: ${response.status}`,
      `Result description: ${response.data}`,
    ].map((msg) => msg.replace(/\n/g, ' ')).join(', ');
    this.logger.info(logMessage, this.logMeta);
    if (!_.isNil(error)) {
      throw error;
    }
    if (_.isNil(result)) {
      throw new Error('result is missing from the api response');
    }
    return result;
  }

  async assertEntityCanBeSynced(entity) {
    const { updatedAt } = entity;
    const lspId = _.get(entity, 'lspId', entity.lsp);
    const connectorInDb = await this.getConnectorByLspId(lspId);

    if (connectorInDb.deleted) {
      this.logger.debug(`SIConnector: SI connector for lsp ${connectorInDb.lspId} is disabled`);
      throw new Error(`SI connector for lsp ${connectorInDb.lspId} is disabled`);
    }
    if (connectorInDb.hasAuthError) {
      this.logger.debug('SIConnector: Authentication failed for SI connector');
      throw new Error('Authentication failed for SI connector');
    }
    const entityDate = moment(updatedAt);
    const syncFromDate = moment(connectorInDb.syncFromDate);

    if (syncFromDate.isAfter(entityDate)) {
      this.logger.debug(`Can't sync entity because syncFromDate ${connectorInDb.syncFromDate} is greater than entity last edit date`);
      throw Error(`Can't sync entity because syncFromDate ${connectorInDb.syncFromDate} is greater than entity last edit date`);
    }
  }

  updateEntitySiConnectorInfo(collectionName, query, siInformation, options) {
    return mongoose.connection.db.collection(collectionName).findOneAndUpdate(
      query,
      { $set: { siConnector: siInformation } },
      options,
    );
  }

  async resetSiConnectorDetailsWhenTimeout(collectionName, query) {
    return this.updateEntitySiConnectorInfo(collectionName, {
      ...query,
      'siConnector.connectorStartedAt': {
        $lte: moment().utc().subtract(CONNECTOR_TIMEOUT_MIN, 'minutes').toDate(),
      },
    }, { isSynced: false });
  }

  async markEntityAsSyncInProgress(collectionName, query, session) {
    const exclusiveQuery = { ...query, 'siConnector.connectorStartedAt': { $exists: false } };
    const options = { upsert: false, timestamp: false, session };
    await this.resetSiConnectorDetailsWhenTimeout(collectionName, query);
    const doc = await this.updateEntitySiConnectorInfo(
      collectionName,
      exclusiveQuery,
      { connectorStartedAt: moment().utc().toDate(), isSynced: false },
      options,
    );
    const didLockSucceed = !_.isNil(doc.value);
    return didLockSucceed;
  }

  markEntityAsSyncFinished(collectionName, query, siDetails, session) {
    const { metadata = null } = siDetails;
    const isSynced = _.isNil(siDetails.error);
    const options = { session, upsert: false, timestamp: isSynced };
    return this.updateEntitySiConnectorInfo(
      collectionName,
      query,
      {
        ...siDetails, connectorEndedAt: moment().utc().toDate(), isSynced, metadata,
      },
      options,
    );
  }

  deleteToken(lspId) {
    return this.tokenManager.deleteToken(lspId);
  }
}

module.exports = new SIConnector();
