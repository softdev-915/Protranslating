import DeliveryMethodResource from '../resources/delivery-method';
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

export default class DeliveryMethodService {
  constructor(resource = DeliveryMethodResource) {
    this.resource = resource;
  }

  get name() {
    return 'delivery-method';
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
    return lspAwareUrl('delivery-method/export');
  }

  create(newDeliveryMethod) {
    return resourceWrapper(this.resource.save(newDeliveryMethod));
  }

  edit(newDeliveryMethod) {
    return resourceWrapper(this.resource.update({ id: newDeliveryMethod._id }, newDeliveryMethod));
  }
}
