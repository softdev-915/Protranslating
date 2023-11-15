import Vue from 'vue';
import lspAwareUrl from '../resources/lsp-aware-url';
import resourceWrapper from './resource-wrapper';

export default class LspLogoImageService {
  upload(formData) {
    const url = lspAwareUrl('image');
    return resourceWrapper(Vue.http.post(url, formData));
  }

  delete() {
    const url = lspAwareUrl('image');
    return resourceWrapper(Vue.http.delete(url));
  }

  save(logo) {
    const url = lspAwareUrl('image');
    return resourceWrapper(Vue.http.put(url, logo));
  }

  getLogoProspectUrl(imageProspectId) {
    return lspAwareUrl(`image/prospect/${imageProspectId}`);
  }
}
