import groupResource from '../resources/group';
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
    name: 'Roles', type: 'array', prop: 'roles', visible: true,
  },
  {
    name: 'Inactive', type: 'string', prop: 'inactiveText', visible: true,
  },
]);

export default class GroupService {
  constructor(resource = groupResource) {
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
    return lspAwareUrl('group/export');
  }

  create(newGroup) {
    return resourceWrapper(this.resource.save(newGroup));
  }

  edit(newGroup) {
    return resourceWrapper(this.resource.update({ id: newGroup._id }, newGroup));
  }
}
