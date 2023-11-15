import schedulingStatusResource from '../resources/scheduling-status';
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
    name: 'Inactive', type: 'string', prop: 'deletedText', visible: true,
  },
]);

export default class SchedulerStatusService {
  constructor(resource = schedulingStatusResource) {
    this.resource = resource;
  }

  get name() {
    return 'schedulerStatus';
  }

  get columns() {
    return COLUMNS;
  }

  get(schedulingStatusId) {
    return resourceWrapper(this.resource.get({ schedulingStatusId }));
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  retrieveCsv() {
    return lspAwareUrl('scheduling-status/export');
  }

  create(schedulerStatus) {
    return resourceWrapper(this.resource.save(schedulerStatus));
  }

  edit(schedulingStatus) {
    const sId = { schedulingStatusId: schedulingStatus._id };
    return resourceWrapper(this.resource.update(sId, schedulingStatus));
  }
}
