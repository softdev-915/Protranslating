import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';
import lspAwareUrl from '../resources/lsp-aware-url';
import certificationResource from '../resources/certification';

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Name', type: 'string', prop: 'name', visible: true,
  },
  {
    name: 'Inactive', type: 'boolean', prop: 'deleted', visible: true,
  },
]);

export default class CertificationService {
  constructor(resource = certificationResource) {
    this.resource = resource;
  }

  get columns() {
    return COLUMNS;
  }

  get(certificationId) {
    return resourceWrapper(this.resource.get({ certificationId }));
  }

  retrieve(params) {
    return resourceWrapper(this.resource.get({ params }));
  }

  retrieveCsv() {
    return lspAwareUrl('certification/export');
  }

  create(certification) {
    return resourceWrapper(this.resource.save(certification));
  }

  edit(certification) {
    const certificationId = certification._id;
    return resourceWrapper(this.resource.update({ certificationId }, certification));
  }
}
