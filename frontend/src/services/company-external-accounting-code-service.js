import companyExternalAccountingCodesResource from '../resources/company-external-accounting-codes';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';
import lspAwareUrl from '../resources/lsp-aware-url';

const COLUMNS = extendColumns([
  { name: 'ID', type: 'string', prop: '_id', visible: false },
  { name: 'Company External Accounting Code', type: 'string', prop: 'companyExternalAccountingCode', visible: true },
  { name: 'Company', type: 'string', prop: 'companyName', visible: true },
  { name: 'Inactive', type: 'boolean', prop: 'deleted', visible: true },
]);

export default class CompanyExternalAccountingCodeService {
  constructor(resource = companyExternalAccountingCodesResource) {
    this.resource = resource;
  }

  get name() {
    return 'company-external-accounting-codes';
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

  retrieveCsv() {
    return lspAwareUrl('company-external-accounting-codes/export');
  }

  create(newCompanyExternalAccountingCode) {
    return resourceWrapper(this.resource.save(newCompanyExternalAccountingCode));
  }

  edit(newCompanyExternalAccountingCode) {
    return resourceWrapper(this.resource.update({
      id: newCompanyExternalAccountingCode._id,
    }, newCompanyExternalAccountingCode));
  }
}
