import ipInstructionsDeadline from '../resources/ip-instructions-deadline';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';

const COLUMNS = extendColumns([
  { name: 'ID', type: 'string', prop: '_id', visible: false },
  { name: 'Total Or Claims Word Count', type: 'string', prop: 'totalOrClaimsWordCount', visible: true },
  { name: 'Notice Period', type: 'string', prop: 'noticePeriod', visible: true },
  { name: 'Inactive', type: 'string', prop: 'deleted', visible: true },
]);

export default class IpInstructionsDeadlineService {
  constructor(resource = ipInstructionsDeadline) {
    this.resource = resource;
  }

  get columns() {
    return COLUMNS;
  }

  get(id) {
    return resourceWrapper(this.resource.query({ id }));
  }

  retrieve(params) {
    this.params = Object.assign({}, this.params, params);
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  create(newIpInstructionsDeadline) {
    return resourceWrapper(this.resource.save(newIpInstructionsDeadline));
  }

  edit(updatedIpInstructionsDeadline) {
    return resourceWrapper(
      this.resource.update({ id: updatedIpInstructionsDeadline._id }, updatedIpInstructionsDeadline)
    );
  }
}
