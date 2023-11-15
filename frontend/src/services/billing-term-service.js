import billingTermResource from '../resources/billing-term';
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
    name: 'Inactive', type: 'string', prop: 'deletedText', visible: true,
  },
]);

export default class BillingTermService {
  constructor(resource = billingTermResource) {
    this.resource = resource;
  }

  get name() {
    return 'billing-term';
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
    return lspAwareUrl('billing-term/export');
  }

  create(newBillingTerm) {
    return resourceWrapper(this.resource.save(newBillingTerm));
  }

  edit(newBillingTerm) {
    return resourceWrapper(this.resource.update({ id: newBillingTerm._id }, newBillingTerm));
  }
}
