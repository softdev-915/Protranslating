import schedulerResource from '../resources/scheduler';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';
import extendColumns from '../utils/shared-columns';

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Name', type: 'string', prop: 'name', visible: true,
  },
  {
    name: 'Every', type: 'string', prop: 'every', visible: true,
  },
  {
    name: 'Options',
    prop: 'options',
    type: 'array',
    val: (item) => {
      const arr = [];
      if (item && item.options) {
        const keys = Object.keys(item.options);
        keys.forEach((k) => {
          arr.push(`${k} = ${item.options[k]}`);
        });
      }
      return arr;
    },
    visible: false,
  },
  {
    name: 'Inactive', type: 'string', prop: 'inactiveText', visible: true,
  },
]);

export default class SchedulerService {
  constructor(resource = schedulerResource) {
    if (typeof resource === 'function') {
      this.resource = resource();
    } else {
      this.resource = resource;
    }
  }

  get columns() {
    return COLUMNS;
  }

  get(schedulerId) {
    return resourceWrapper(this.resource.get({ schedulerId }));
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  retrieveCsv() {
    return lspAwareUrl('scheduler/export');
  }

  edit(newScheduler) {
    return resourceWrapper(this.resource.update({ schedulerId: newScheduler._id }, newScheduler));
  }

  runNow(newScheduler, schedulerParams = null) {
    const updateParams = { schedulerId: newScheduler.id };
    if (schedulerParams !== null) {
      Object.assign(updateParams, { params: JSON.stringify(schedulerParams) });
    }
    return resourceWrapper(this.resource.update(updateParams));
  }
}
