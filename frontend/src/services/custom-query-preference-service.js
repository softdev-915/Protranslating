import customQueryPreferenceResource from '../resources/custom-query-preference';
import resourceWrapper from './resource-wrapper';

export default class CustomQueryService {
  constructor(resource = customQueryPreferenceResource) {
    this.resource = resource;
  }

  get name() {
    return 'custom-query-preference';
  }

  get columns() {
    return [];
  }

  get(customQueryId) {
    return resourceWrapper(this.resource.query({ customQueryId }));
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  create(customQueryPreference) {
    return resourceWrapper(this.resource.save(customQueryPreference));
  }

  edit(customQueryPreference) {
    return resourceWrapper(this.resource.update({
      customQueryId: customQueryPreference.customQueryId,
    }, customQueryPreference));
  }
}
