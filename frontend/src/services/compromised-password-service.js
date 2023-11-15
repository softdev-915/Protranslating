import compromisedPasswordResource from '../resources/compromised-password';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';
import lspAwareUrl from '../resources/lsp-aware-url';

const COLUMNS = extendColumns([
  { name: 'ID', type: 'string', prop: '_id', visible: false },
  { name: 'Compromised password', type: 'string', prop: 'password', visible: true },
  { name: 'Inactive', type: 'string', prop: 'deleted', visible: false },
]);

export default class CompromisedPasswordService {
  constructor(resource = compromisedPasswordResource) {
    this.resource = resource;
  }

  get name() {
    return 'compromised-password';
  }

  get columns() {
    return COLUMNS;
  }

  get(id) {
    return resourceWrapper(this.resource.query({ id }));
  }

  retrieve(params) {
    this.params = Object.assign({}, this.params, params);
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  retrieveCsv() {
    return lspAwareUrl('compromised-password/export');
  }
}
