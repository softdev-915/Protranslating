import companyDepartmentRelationshipResource from '../resources/company-department-relationship';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';
import lspAwareUrl from '../resources/lsp-aware-url';

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Company',
    type: 'string',
    prop: 'companyName',
    visible: true,
  },
  {
    name: 'LSP Internal department',
    type: 'string',
    prop: 'internalDepartmentName',
    visible: true,
  },
  {
    name: 'Bill Creation Day', type: 'string', prop: 'billCreationDay', visible: true,
  },
  {
    name: 'Accept Invoice Per Period', type: 'boolean', prop: 'acceptInvoicePerPeriod', visible: true,
  },
  {
    name: 'Inactive', type: 'boolean', prop: 'deleted', visible: true,
  },
]);

export default class ExpenseAccountService {
  constructor(resource = companyDepartmentRelationshipResource) {
    this.resource = resource;
  }

  get name() {
    return 'company-department-relationship';
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
    return lspAwareUrl('company-department-relationship/export');
  }

  create(newCompanyDepartmentRelationship) {
    return resourceWrapper(this.resource.save(newCompanyDepartmentRelationship));
  }

  edit(newCompanyDepartmentRelationship) {
    return resourceWrapper(this.resource.update({
      id: newCompanyDepartmentRelationship._id,
    }, newCompanyDepartmentRelationship));
  }
}
