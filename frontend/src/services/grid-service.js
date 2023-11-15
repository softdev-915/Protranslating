import gridResource from '../resources/grid';
import resourceWrapper from './resource-wrapper';

export default class GridService {
  constructor(resource = gridResource) {
    this.resource = resource;
  }

  deleteConfig(name, configName) {
    const toWrap = this.resource.delete({ name: name, configName: configName });
    return resourceWrapper(toWrap);
  }

  update(name, configs) {
    return resourceWrapper(this.resource.update({ name: name }, configs));
  }

  getAllGrids() {
    const promise = this.resource.query();
    return resourceWrapper(promise);
  }
}
