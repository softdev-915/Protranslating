import activityTagResource from '../resources/activity-tag';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';
import lspAwareUrl from '../resources/lsp-aware-url';

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Name', type: 'string', prop: 'name', visible: true,
  },
  {
    name: 'Inactive', type: 'boolean', prop: 'deleted', visible: true,
  },
]);

export default class ActivityTagService {
  constructor(resource = activityTagResource) {
    this.resource = resource;
  }

  get columns() {
    return COLUMNS;
  }

  get(activityTagId) {
    return resourceWrapper(this.resource.get({ activityTagId }));
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  retrieveCsv() {
    return lspAwareUrl('activity/tag/export');
  }

  create(activityTag) {
    return resourceWrapper(this.resource.save(activityTag));
  }

  edit(activityTag) {
    return resourceWrapper(this.resource.update({ activityTagId: activityTag._id }, activityTag));
  }
}
