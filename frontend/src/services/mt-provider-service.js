import mtProviderResource from '../resources/mt-provider';
import resourceWrapper from './resource-wrapper';

export default class MTProviderService {
  constructor(resource = mtProviderResource) {
    this.resource = resource;
  }

  get name() {
    return 'mt-provider';
  }

  get(id) {
    return resourceWrapper(this.resource.query({ id }));
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }
}
