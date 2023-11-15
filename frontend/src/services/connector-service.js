import _ from 'lodash';
import Vue from 'vue';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';
import lspAwareUrl from '../resources/lsp-aware-url';
import connectorResource from '../resources/connector';
import connectorTestConnectivityResource from '../resources/connector-test-connectivity';

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Connector Name', type: 'string', prop: 'name', visible: true,
  },
  {
    name: 'Username', type: 'string', prop: 'username', visible: true,
  },
  {
    name: 'Remote URL', type: 'string', prop: 'remoteUrl', visible: true,
  },
  {
    name: 'Inactive', type: 'boolean', prop: 'deleted', visible: true,
  },
  {
    name: 'Sync From Date And Time', type: 'string', prop: 'syncFromDate', visible: true,
  },
  {
    name: 'Sender Id', type: 'string', prop: 'senderId', visible: true,
  },
  {
    name: 'Company Id', type: 'string', prop: 'companyId', visible: true,
  },
]);
export default class ConnectorService {
  constructor(resource = connectorResource) {
    this.resource = resource;
    this.testConnectivityResource = connectorTestConnectivityResource;
  }
  get columns() {
    return COLUMNS;
  }
  get(connectorId) {
    return resourceWrapper(this.resource.get({ connectorId }));
  }
  retrieve(params) {
    return resourceWrapper(this.resource.get({ params }));
  }
  retrieveCsv() {
    return lspAwareUrl('connector/export');
  }
  testConnectivity(params) {
    return resourceWrapper(this.testConnectivityResource.get(params));
  }
  edit(connector) {
    const connectorId = connector._id;
    return resourceWrapper(this.resource.update({ connectorId }, connector));
  }
  getPayloadDownloadUrl(connectorId, payloadName) {
    const payloadDownloadUrl = lspAwareUrl(
      `connector/${connectorId}/download/${payloadName}`,
    );
    return payloadDownloadUrl;
  }
  getEntityPayload(entityName, entityId) {
    const url = lspAwareUrl('connector/payload');
    return resourceWrapper(Vue.http.get(url, { params: { entityName, entityId } }));
  }
  runScheduler(_scheduler, { entity, entityId = null }) {
    let url;
    if (_.isString(entityId) && !_.isEmpty(entityId)) {
      url = lspAwareUrl('connector/sync-entity');
      return resourceWrapper(Vue.http.post(url, { entity, entityId }));
    }
    url = lspAwareUrl('connector/sync-all-entities');
    return resourceWrapper(Vue.http.post(url, { entity }));
  }
}
