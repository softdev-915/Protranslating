import Vue from 'vue';
import lspAwareUrl from '../resources/lsp-aware-url';
import PIIResource from '../resources/pii';
import resourceWrapper from './resource-wrapper';

export default class PIIService {
  constructor(resource = PIIResource) {
    this.resource = resource;
    this.endpointBuilder = lspAwareUrl;
  }

  retrievePIIValue(collection, entityId, path) {
    const url = this.endpointBuilder(`reveal-pii/${collection}/${entityId}?path=${path}`);
    return resourceWrapper(Vue.http.get(url));
  }
}
