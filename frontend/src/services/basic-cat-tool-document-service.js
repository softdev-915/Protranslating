import basicCatToolDocumentResource from '../resources/basic-cat-tool-document';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';
import extendColumns from '../utils/shared-columns';

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Request', type: 'string', prop: 'request', visible: true,
  },
  {
    name: 'Document', type: 'string', prop: 'document', visible: true,
  },
  {
    name: 'Language', type: 'string', prop: 'language', val: (item) => item.language.isoCode, visible: true,
  },
  {
    name: 'Inactive', type: 'boolean', prop: 'deleted', visible: true,
  },
]);

export default class BasicCATToolDocumentService {
  constructor(resource = basicCatToolDocumentResource) {
    this.resource = resource;
    this.endpointBuilder = lspAwareUrl;
  }

  get columns() {
    return COLUMNS;
  }

  retrieveInfo(basicCatToolDocument) {
    return resourceWrapper(this.resource.get(basicCatToolDocument));
  }

  getBasicCATToolDocumentUrl(companyId, requestId, documentId, page) {
    const basicCatToolDocumentEndpoint = `company/${companyId}/request/${requestId}/document/${documentId}/${page}`;
    return this.endpointBuilder(basicCatToolDocumentEndpoint);
  }
}
