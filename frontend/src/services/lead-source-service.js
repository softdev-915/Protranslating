import LeadSourceResource from '../resources/lead-source';
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

export default class LeadSourceService {
  constructor(resource = LeadSourceResource) {
    this.resource = resource;
  }

  get columns() {
    return COLUMNS;
  }

  get(id) {
    return resourceWrapper(this.resource.query({ id }));
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  retrieveCsv() {
    return lspAwareUrl('lead-source/export');
  }

  create(newLeadSource) {
    return resourceWrapper(this.resource.save(newLeadSource));
  }

  edit(newLeadSource) {
    return resourceWrapper(this.resource.update({ id: newLeadSource._id }, newLeadSource));
  }
}
