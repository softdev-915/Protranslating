import Vue from 'vue';
import { store } from '../stores/store';
import lspAwareUrl from '../resources/lsp-aware-url';
import resourceWrapper from './resource-wrapper';

export default class LspService {
  constructor() {
    this.resource = Vue.resource('/api/lsp/');
  }

  retrieve(options) {
    return resourceWrapper(Vue.http.put('/api/lsp/selector', options));
  }
  retrieveLspListByEmail(email) {
    return resourceWrapper(Vue.resource('/api/lsp-list/{email}').get({ email }));
  }
  edit(lsp) {
    const url = lspAwareUrl('update');
    return resourceWrapper(Vue.http.put(url, lsp));
  }

  get(lspId) {
    return Vue.resource('/api/lsp/{lspId}').get({ lspId }).finally(() => {
      store.dispatch('app/triggerGlobalEvent', { blurLoading: false });
    });
  }

  retrievePcSettingsResources() {
    const url = lspAwareUrl('pc-settings/sr');
    return resourceWrapper(Vue.http.get(url));
  }

  uploadPcSettingsResource({ formData, language }) {
    const url = lspAwareUrl('pc-settings/sr');
    return resourceWrapper(Vue.http.post(url, formData, { params: { language } }));
  }

  updatePcSettingsResource({ type, formData, resourceId }) {
    const url = lspAwareUrl('pc-settings/sr/{resourceId}');
    return resourceWrapper(Vue.resource(url, { type }).update({ resourceId }, formData));
  }

  deletePcSettingsResources({ type, resourceIds }) {
    const url = lspAwareUrl('pc-settings/sr');
    return resourceWrapper(Vue.resource(url).delete(null, { type, resourceIds }));
  }

  async getPcSettingsResource({ resourceId, companyId }) {
    const url = lspAwareUrl('pc-settings/sr/{resourceId}/download');
    const response = await Vue.resource(url, null, null, { responseType: 'blob' }).get({ companyId, resourceId });
    const contentType = response.headers.get('content-type');
    const disposition = response.headers.get('content-disposition');
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    const filename = matches[1].replace(/['"]/g, '');
    return { type: contentType, data: response.data, filename };
  }

  async getPcSettingsResourcesZip({ resourceIds, companyId, type }) {
    const url = lspAwareUrl('pc-settings/sr/zip');
    const response = await Vue.resource(url, null, null, { responseType: 'blob' }).save({ companyId }, { resourceIds, type });
    const contentType = response.headers.get('content-type');
    const disposition = response.headers.get('content-disposition');
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    const filename = matches[1].replace(/['"]/g, '');
    return { type: contentType, data: response.data, filename };
  }
}
