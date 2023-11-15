import internalDepartmentResource from '../resources/internal-department';
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
    name: 'Accounting Department ID', type: 'string', prop: 'accountingDepartmentId', visible: true,
  },
  {
    name: 'Inactive', type: 'string', prop: 'deletedText', visible: true,
  },
]);

export default class InternalDepartmentService {
  constructor(resource = internalDepartmentResource) {
    this.resource = resource;
  }

  get name() {
    return 'internal-department';
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
    return lspAwareUrl('internal-department/export');
  }

  create(newInternalDepartment) {
    return resourceWrapper(this.resource.save(newInternalDepartment));
  }

  edit(newInternalDepartment) {
    return resourceWrapper(this.resource.update({ id: newInternalDepartment._id },
      newInternalDepartment));
  }
}
