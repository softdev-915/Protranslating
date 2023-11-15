import Vue from 'vue';
import _ from 'lodash';
import extendColumns from '../utils/shared-columns';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';
import BaseDebounceService from './base-debounce-service';

export default class BasicService extends BaseDebounceService {
  constructor(resource, name, columns, options) {
    super();
    this.resource = resource;
    this.__name__ = name;
    this.__kebabName__ = _.kebabCase(name);
    this.__columns__ = extendColumns(columns);
    this.options = options;
  }

  get name() {
    return this.__name__;
  }

  get columns() {
    return this.__columns__;
  }

  retrieveCsv() {
    return lspAwareUrl(`${this.__kebabName__}/export`);
  }

  retrieve(params) {
    return resourceWrapper(this.resource.get({ params }));
  }

  get(id) {
    return resourceWrapper(this.resource.get({ id }));
  }

  create(entity, params = {}) {
    return resourceWrapper(this.resource.save(params, entity));
  }

  edit(entity) {
    return resourceWrapper(this.resource.update({ id: entity._id }, entity));
  }

  uploadAttachment(params, formData) {
    const url = lspAwareUrl(`${this.__kebabName__}/{entityId}/attachments/upload`);
    return resourceWrapper(Vue.http.post(url, formData, { params }));
  }

  detach(params) {
    const url = lspAwareUrl(`${this.__kebabName__}/{entityId}/attachments/{attachmentId}`);
    return resourceWrapper(Vue.http.delete(url, { params }));
  }

  async downloadAttachment(params) {
    const url = lspAwareUrl(`${this.__kebabName__}/{entityId}/attachments/{attachmentId}`);
    const res = await Vue.http.get(url, { responseType: 'blob', params });
    const type = res.headers.get('content-type');
    const disposition = res.headers.get('content-disposition');
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    const filename = matches[1].replace(/['"]/g, '');
    return { type, data: res.data, filename };
  }
}
