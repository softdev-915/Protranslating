import DocumentTypeResource from '../resources/document-type';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';
import lspAwareUrl from '../resources/lsp-aware-url';

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Name', type: 'string', prop: 'name', visible: true,
  },
  {
    name: 'Extensions', type: 'string', prop: 'extensions', visible: true,
  },
  {
    name: 'Inactive', type: 'string', prop: 'deletedText', visible: true,
  },
]);

export default class DocumentTypeService {
  constructor(resource = DocumentTypeResource) {
    this.resource = resource;
  }

  get name() {
    return 'document-type';
  }

  get columns() {
    return COLUMNS;
  }

  get(id) {
    return resourceWrapper(this.resource.query({ id }));
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  retrieveCsv() {
    return lspAwareUrl('document-type/export');
  }

  create(newDocumentType) {
    return resourceWrapper(this.resource.save(newDocumentType));
  }

  edit(newDocumentType) {
    return resourceWrapper(this.resource.update({ id: newDocumentType._id }, newDocumentType));
  }
}
