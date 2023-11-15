import Vue from 'vue';
import templateResource from '../resources/template';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';
import extendColumns from '../utils/shared-columns';

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Type', type: 'string', prop: 'type', visible: true,
  },
  {
    name: 'Name', type: 'string', prop: 'name', visible: true,
  },
  {
    name: 'Inactive', type: 'string', prop: 'deletedText', visible: true,
  },
]);

export default class TemplateService {
  constructor() {
    this.resource = templateResource;
  }

  get columns() {
    return COLUMNS;
  }

  create(template) {
    return resourceWrapper(this.resource.save(template));
  }

  get(templateId) {
    return resourceWrapper(this.resource.get({ templateId }));
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  retrieveByTypes(types) {
    return resourceWrapper(this.resource.get({ types }));
  }

  retrieveByName(name) {
    const url = lspAwareUrl(`template/name/${name}`);
    return resourceWrapper(Vue.http.get(url));
  }

  retrieveCsv() {
    return lspAwareUrl('template/export');
  }

  edit(template) {
    return resourceWrapper(this.resource.update({
      templateId: template._id,
    }, template));
  }
}
