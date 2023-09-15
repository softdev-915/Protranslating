const _ = require('lodash');
const siConnector = require('./index');
const SiConnectorError = require('./error');
const moment = require('moment');
const xml2json = require('xml2json');
const MockableMoment = require('../../components/moment');

const MOCKED_ENTITY_SYNC_DELAY_SECONDS = {
  companies: 2,
  users: 4,
  invoices: 6,
  bills: 8,
  arAdjustments: 10,
  billAdjustments: 12,
  arAdvances: 14,
  arPayments: 16,
  apPayments: 18,
};

const MOCKED_SI_KEYS_MAP = {
  customer: 'CUSTOMERID',
  apbill: 'RECORDNO',
  apadjustment: 'RECORDNO',
  arpymt: 'RECORDNO',
  arinvoice: 'RECORDNO',
  aradjustment: 'RECORDNO',
};
class SIMockConnector extends siConnector.constructor {
  constructor(flags) {
    super();
    this.shouldMockSiSyncFail = _.get(flags, 'shouldMockSiSyncFail', false);
    this.shouldMockSiDisabled = _.get(flags, 'shouldMockSiDisabled', false);
    this.shouldMockSiAuthFail = _.get(flags, 'shouldMockSiAuthFail', false);
    this.siMockSyncFrom = _.get(flags, 'siMockSyncFrom', null);
    this.mockServerTime = _.get(flags, 'mockServerTime', null);
    this.payloadsXml = siConnector.payloadsXml;
    this.siCountriesMap = siConnector.siCountriesMap;
    this.mockableMoment = new MockableMoment(this.mockServerTime);
  }

  async getSiMetadataFromResponse(response, siName) {
    if (_.has(response, `data.${siName}`)) {
      return response.data[siName];
    }
    if (!_.isNil(response.key)) {
      const siMockedId = _.trim(response.key.split('=')[1]).replace(/'/g, '');
      const siKey = MOCKED_SI_KEYS_MAP[siName];
      return { [siKey]: siMockedId };
    }
  }

  async getConnectorByLspId(lspId) {
    const connectorInDb = await super.getConnectorByLspId(lspId);
    connectorInDb.deleted = this.shouldMockSiDisabled;
    return connectorInDb;
  }

  async shouldMockSyncFromError() {
    const currentDate = moment();
    if (!_.isNil(this.siMockSyncFrom)) {
      const mockFromDate = moment(this.siMockSyncFrom, 'MM-DD-YYYY');
      if (mockFromDate.isAfter(currentDate)) {
        throw SiConnectorError.generateMockError('Mock Sync From is set in an future date');
      }
    }
  }

  async syncEntity(entity, payloads, siName, mongoCollection) {
    if (this.shouldMockSiAuthFail) {
      throw SiConnectorError.generateMockError('Authentication failed');
    }
    if (entity.shouldMockSiUserSyncFail || this.shouldMockSiSyncFail) {
      throw SiConnectorError.generateMockError('SI connector error');
    }
    if (this.shouldMockSiDisabled) {
      const lspId = this.getLspIdFromEntity(entity);
      throw SiConnectorError.generateMockError(`SI connector for lsp ${lspId} is disabled`);
    }
    await this.shouldMockSyncFromError();
    await super.syncEntity(entity, payloads, siName, mongoCollection);
    return {};
  }

  async getRequestResult(_endpoint, requestData) {
    if (this.shouldMockSiAuthFail) {
      throw SiConnectorError.generateMockError('Authentication failed');
    }
    const jsonData = JSON.parse(xml2json.toJson(requestData));
    const mockedRecordNo = _.get(jsonData, 'request.operation.content.function.readByQuery.query');
    const data = { api: { endpoint: 'mock', sessionid: 'mock' }, count: '1' };
    return { data, key: mockedRecordNo };
  }

  async testConnectivity(lspId) {
    await super.testConnectivity(lspId);
    if (this.shouldMockSiSyncFail) {
      throw SiConnectorError.generateMockError('SI connector error');
    }
  }

  updateEntitySiConnectorInfo(collectionName, query, siInformation, options) {
    const mockSiInformation = { ...siInformation, isMocked: true };
    return super.updateEntitySiConnectorInfo(collectionName, query, mockSiInformation, options);
  }

  markEntityAsSyncFinished(collectionName, query, siDetails, session) {
    const delay = _.get(MOCKED_ENTITY_SYNC_DELAY_SECONDS, collectionName);
    const connectorEndedAt = this.mockableMoment.getDateObject().add(delay, 'seconds').toDate();
    const updatedSiDetails = { ...siDetails, connectorEndedAt };
    const { metadata = null } = siDetails;
    const isSynced = _.isNil(siDetails.error);
    const options = { session, upsert: false, timestamp: isSynced };
    return this.updateEntitySiConnectorInfo(collectionName, query,
      { ...updatedSiDetails, isSynced, metadata }, options);
  }
}

module.exports = SIMockConnector;
