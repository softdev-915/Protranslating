import PaymentMethodResource from '../resources/payment-method';
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

export default class PaymentMethodService {
  constructor(resource = PaymentMethodResource) {
    this.resource = resource;
  }

  get name() {
    return 'payment-method';
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
    return lspAwareUrl('payment-method/export');
  }

  create(newPaymentMethod) {
    return resourceWrapper(this.resource.save(newPaymentMethod));
  }

  edit(newPaymentMethod) {
    return resourceWrapper(this.resource.update({ id: newPaymentMethod._id }, newPaymentMethod));
  }
}
