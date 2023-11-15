import deliveryTypeResource from '../resources/delivery-type';
import resourceWrapper from './resource-wrapper';
import BasicService from './basic-service';
import extendColumns from '../utils/shared-columns';

const COLUMNS = extendColumns([
  { name: 'ID', type: 'string', prop: '_id', visible: true },
  { name: 'Name', type: 'string', prop: 'name', visible: true },
  { name: 'Description', type: 'string', prop: 'description', visible: true },
  { name: 'Inactive', type: 'boolean', prop: 'deleted', visible: true },
]);

export default class DeliveryTypeService extends BasicService {
  constructor(resource = deliveryTypeResource) {
    super(resource, 'delivery-type', COLUMNS);
  }

  get name() {
    return 'delivery-type-service';
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

  create(deliveryType) {
    return resourceWrapper(this.resource.save(deliveryType));
  }

  edit(deliveryType) {
    return resourceWrapper(this.resource.update({ id: deliveryType._id }, deliveryType));
  }

  nameList(params) {
    return resourceWrapper(this.resource.get({ nameList: 'nameList', params }));
  }
}
