import RevenueAccountsResource from '../resources/revenue-accounts';
import lspAwareUrl from '../resources/lsp-aware-url';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';
// import lspAwareUrl from '../resources/lsp-aware-url';

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: true,
  },
  {
    name: 'Number', type: 'number', prop: 'no', visible: true,
  },
  {
    name: 'Name', type: 'string', prop: 'name', visible: true,
  },
  {
    name: 'Inactive', type: 'string', prop: 'deletedText', val: (item) => item.deleted, visible: true,
  },
]);

export default class RevenueAccountService {
  constructor(resource = RevenueAccountsResource) {
    this.resource = resource;
  }

  get name() {
    return 'revenue-accounts';
  }

  get columns() {
    return COLUMNS;
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  retrieveCsv() {
    return lspAwareUrl('revenue-account/export');
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
