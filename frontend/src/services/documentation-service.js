import documentationResource from '../resources/documentation';
import resourceWrapper from './resource-wrapper';

export default class DocumentationService {
  constructor(resource = documentationResource) {
    if (typeof resource === 'function') {
      this.resource = resource();
    } else {
      this.resource = resource;
    }
  }

  get(name, query) {
    let path;
    if (name) {
      path = { id: name };
    }
    if (query) {
      return resourceWrapper(this.resource.query(query));
    }
    return resourceWrapper(this.resource.get(path));
  }

  update(name, doc) {
    return resourceWrapper(this.resource.update({ id: name }, doc));
  }
}
