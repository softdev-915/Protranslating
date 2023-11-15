import roleResource from '../resources/role';
import resourceWrapper from './resource-wrapper';

export default class RoleService {
  constructor(resource = roleResource) {
    if (typeof resource === 'function') {
      this.resource = resource();
    } else {
      this.resource = resource;
    }
  }

  retrieve() {
    return resourceWrapper(this.resource.query());
  }
}
