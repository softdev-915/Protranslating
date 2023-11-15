import Vue from 'vue';
import lspAwareUrl from '../resources/lsp-aware-url';
import resourceWrapper from './resource-wrapper';

export default class TranslationMemoryService {
  constructor() {
    this.endpointBuilder = lspAwareUrl;
  }

  getSegments(companyId, tmId) {
    const url = this.endpointBuilder(`company/${companyId}/translation-memory/${tmId}/segments`);
    return resourceWrapper(Vue.http.get(url), false);
  }

  getSegmentHistory({ companyId, tmId, originalId }) {
    const url = this.endpointBuilder(`company/${companyId}/translation-memory/${tmId}/segments/${originalId}/history`);
    return resourceWrapper(Vue.http.get(url), false);
  }

  getSegmentDetails({ companyId, tmId, originalId }) {
    const url = this.endpointBuilder(`company/${companyId}/translation-memory/${tmId}/segments/${originalId}/info`);
    return resourceWrapper(Vue.http.get(url), false);
  }

  deleteSegment({ companyId, tmId, originalId }) {
    const url = this.endpointBuilder(`company/${companyId}/translation-memory/${tmId}/segments/${originalId}`);
    return resourceWrapper(Vue.http.delete(url), false);
  }

  createSegment({ companyId, tmId, body }) {
    const url = this.endpointBuilder(`company/${companyId}/translation-memory/${tmId}/segments`);
    return resourceWrapper(Vue.http.post(url, body), false);
  }

  updateSegment({ companyId, tmId, originalId, body }) {
    const url = this.endpointBuilder(`company/${companyId}/translation-memory/${tmId}/segments/${originalId}`);
    return resourceWrapper(Vue.http.put(url, body), false);
  }

  searchSegments({ companyId, tmId, params }) {
    const url = this.endpointBuilder(`company/${companyId}/translation-memory/${tmId}/segments/search`);
    return resourceWrapper(Vue.http.post(url, { params }), false);
  }

  replaceSegmentsContent({ companyId, tmId, body }) {
    const url = this.endpointBuilder(`company/${companyId}/translation-memory/${tmId}/segments/search/replace`);
    return resourceWrapper(Vue.http.post(url, body), false);
  }
}
