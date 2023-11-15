import resourceWrapper from './resource-wrapper';
import externalResource from '../resources/external-resource';

export default class ExternalResourceService {
  constructor(resource = externalResource) {
    this.resource = resource;
  }

  retrieve() {
    return resourceWrapper(this.resource.get());
  }

  save(externalResources) {
    return resourceWrapper(this.resource.update({}, externalResources));
  }
}
