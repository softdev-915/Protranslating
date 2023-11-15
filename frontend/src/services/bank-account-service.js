import BankAccountResource from '../resources/bank-account';
import lspAwareUrl from '../resources/lsp-aware-url';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: true,
  },
  {
    name: 'Bank Account ID', type: 'string', prop: 'no', visible: true,
  },
  {
    name: 'Name', type: 'string', prop: 'name', visible: true,
  },
  {
    name: 'Inactive', type: 'boolean', prop: 'deleted', visible: true,
  },
]);

export default class AccountService {
  constructor(resource = BankAccountResource) {
    this.resource = resource;
  }

  get name() {
    return 'bank-account';
  }

  get columns() {
    return COLUMNS;
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  retrieveCsv() {
    return lspAwareUrl('bank-account/export');
  }

  create(body) {
    return resourceWrapper(this.resource.save(body));
  }

  get(id) {
    return resourceWrapper(this.resource.get({ id }));
  }

  edit(body) {
    return resourceWrapper(this.resource.update({ id: body._id }, body));
  }
}
