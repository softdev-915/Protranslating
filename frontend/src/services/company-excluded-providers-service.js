import Vue from 'vue';
import companyExcludedProvidersResource from '../resources/company-excluded-providers';
import lspAwareUrl from '../resources/lsp-aware-url';
import resourceWrapper from './resource-wrapper';

export default class CompanyExcludedProvidersService {
  constructor(resource = companyExcludedProvidersResource) {
    this.resource = resource;
  }

  get name() {
    return 'companyExcludedProviders';
  }

  retrieve(params) {
    const companyId = JSON.parse(params.filter).companyId;
    this.params = Object.assign({}, this.params, params);
    const url = lspAwareUrl(`company-excluded-providers/company/${companyId}`);
    return resourceWrapper(Vue.http.get(url));
  }
}
