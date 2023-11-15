import serviceTypeResource from '../resources/service-type';
import resourceWrapper from './resource-wrapper';
import BasicService from './basic-service';
import extendColumns from '../utils/shared-columns';

const COLUMNS = extendColumns([
  { name: 'ID', type: 'string', prop: '_id', visible: true },
  { name: 'Name', type: 'string', prop: 'name', visible: true },
  { name: 'Description', type: 'string', prop: 'description', visible: true },
  { name: 'Inactive', type: 'boolean', prop: 'deleted', visible: true },
]);

export default class ServiceTypeService extends BasicService {
  constructor(resource = serviceTypeResource) {
    super(resource, 'service-type', COLUMNS);
  }

  get name() {
    return 'service-type-service';
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

  create(serviceType) {
    return resourceWrapper(this.resource.save(serviceType));
  }

  edit(serviceType) {
    return resourceWrapper(this.resource.update({ id: serviceType._id }, serviceType));
  }

  nameList(params) {
    return resourceWrapper(this.resource.get({ nameList: 'nameList', params }));
  }
}
