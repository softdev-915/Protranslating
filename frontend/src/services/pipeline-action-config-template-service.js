import Vue from 'vue';
import pipelineActionConfigTemplateResource from '../resources/pipeline-action-config-template';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';

export default class PipelineActionConfigTemplateService {
  constructor(resource = pipelineActionConfigTemplateResource) {
    this.resource = resource;
  }

  get(id) {
    return resourceWrapper(this.resource.query({ id }));
  }

  retrieve({ companyId, action, term } = {}) {
    return resourceWrapper(this.resource.get({ companyId, action, term }));
  }

  getTemplateByName({ companyId, action, name }) {
    const templateName = encodeURIComponent(name);
    const url = lspAwareUrl(`/company/${companyId}/pl-action-config-templates/name/${templateName}?action=${action}`);
    return resourceWrapper(Vue.http.get(url));
  }

  create(companyId, data) {
    return resourceWrapper(this.resource.save({ companyId }, data));
  }

  update(companyId, id, data) {
    return resourceWrapper(this.resource.update({ companyId, id }, data));
  }

  hide(companyId, id) {
    return resourceWrapper(this.resource.delete({ companyId, id }));
  }

  deleteAll(companyId) {
    return resourceWrapper(this.resource.delete({ companyId }));
  }
}
