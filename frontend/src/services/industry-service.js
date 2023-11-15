import industryResource from '../resources/industry';
import resourceWrapper from './resource-wrapper';

export default class IndustryService {
  constructor(resource = industryResource) {
    this.resource = resource;
  }

  retrieve() {
    return resourceWrapper(this.resource.get());
  }
}
