import stateResource from '../resources/state';
import resourceWrapper from './resource-wrapper';

export default class StateService {
  constructor(resource = stateResource) {
    if (typeof resource === 'function') {
      this.resource = resource();
    } else {
      this.resource = resource;
    }
  }

  retrieve(params) {
    return resourceWrapper(this.resource.get({ countryId: params.country }));
  }
}
