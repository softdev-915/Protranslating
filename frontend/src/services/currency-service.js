import currencyResource from '../resources/currency';
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
    name: 'ISO Code', type: 'string', prop: 'isoCode', visible: true,
  },
  {
    name: 'Inactive', type: 'string', prop: 'deletedText', visible: true,
  },
  {
    name: 'Currency Symbol', type: 'string', prop: 'symbol', visible: true,
  },
]);

export default class CurrencyService {
  constructor(resource = currencyResource) {
    this.resource = resource;
  }

  get name() {
    return 'currency';
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
    return lspAwareUrl('currency/export');
  }

  create(newCurrency) {
    return resourceWrapper(this.resource.save(newCurrency));
  }

  edit(newCurrency) {
    return resourceWrapper(this.resource.update({ id: newCurrency._id }, newCurrency));
  }
}
