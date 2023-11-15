import Vue from 'vue';
import lspAwareUrl from '../resources/lsp-aware-url';
import AttachmentsResource from '../resources/attachements';
import resourceWrapper from './resource-wrapper';

export default class AttachmentsService {
  constructor(resource = AttachmentsResource) {
    this.resource = resource;
  }

  attach({ entityName, entityId }, formData) {
    const url = lspAwareUrl('attachments/{entityName}/{entityId}');
    const params = { entityName, entityId };
    return resourceWrapper(Vue.http.post(url, formData, { params }));
  }

  detach(params) {
    const url = lspAwareUrl('attachments/{entityName}/{entityId}/{attachmentId}');
    return resourceWrapper(Vue.http.delete(url, { params }));
  }

  async downloadAttachment(params) {
    const url = lspAwareUrl('attachments/{entityName}/{entityId}/{attachmentId}');
    const res = await Vue.http.get(url, { responseType: 'blob', params });
    const type = res.headers.get('content-type');
    const disposition = res.headers.get('content-disposition');
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    const filename = matches[1].replace(/['"]/g, '');
    return { type, data: res.data, filename };
  }
}
