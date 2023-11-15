import Vue from 'vue';
import documentProspectResource from '../resources/document-prospect';
import lspAwareUrl from '../resources/lsp-aware-url';
import resourceWrapper from './resource-wrapper';

export default class DocumentProspectService {
  constructor(resource = documentProspectResource) {
    this.resource = resource;
  }

  uploadCompanyProspect(formData, companyId) {
    return resourceWrapper(this.resource.save({ companyId }, formData));
  }

  upload(formData) {
    const url = lspAwareUrl('document-prospect');
    return resourceWrapper(Vue.http.post(url, formData));
  }

  delete(id) {
    return resourceWrapper(this.resource.remove({ id }));
  }
}
