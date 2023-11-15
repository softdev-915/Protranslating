import TaxFormResource from '../resources/tax-form';
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
    name: 'Tax ID Required', type: 'boolean', prop: 'taxIdRequired', visible: true,
  },
  {
    name: 'Inactive', type: 'string', prop: 'deletedText', visible: true,
  },
]);

export default class TaxFormService {
  constructor(resource = TaxFormResource) {
    this.resource = resource;
  }

  get name() {
    return 'tax-form';
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
    return lspAwareUrl('tax-form/export');
  }

  create(newTaxForm) {
    return resourceWrapper(this.resource.save(newTaxForm));
  }

  edit(newTaxForm) {
    return resourceWrapper(this.resource.update({ id: newTaxForm._id }, newTaxForm));
  }
}
