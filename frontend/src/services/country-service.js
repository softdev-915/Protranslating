import countryResource from '../resources/country';
import resourceWrapper from './resource-wrapper';

export default class CountryService {
  constructor(resource = countryResource) {
    if (typeof resource === 'function') {
      this.resource = resource();
    } else {
      this.resource = resource;
    }
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }
}
