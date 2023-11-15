import Vue from 'vue';
import _ from 'lodash';
import vendorMinimumCharge from '../resources/vendor-minimum-charge';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';
import lspAwareUrl from '../resources/lsp-aware-url';

const COLUMNS = extendColumns([
  {
    name: 'Id', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Name', type: 'string', prop: 'vendorName', visible: true,
  },
  {
    name: 'Ability', type: 'string', prop: 'abilityText', visible: true,
  },
  {
    name: 'Language Combinations', type: 'string', prop: 'languageCombinations', visible: true,
  },
  {
    name: 'Rate',
    type: 'string',
    prop: 'rate',
    visible: true,
    val: ({ rate }) => _.toNumber(rate).toFixed(4),
  },
  {
    name: 'Inactive', type: 'string', prop: 'deleted', visible: true,
  },
]);

export default class ExpenseAccountService {
  constructor(resource = vendorMinimumCharge) {
    this.resource = resource;
  }

  get name() {
    return 'vendor-minimum-charge';
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
    return lspAwareUrl('vendor-minimum-charge/export');
  }

  create(newVendorMinimumCharge) {
    return resourceWrapper(this.resource.save(newVendorMinimumCharge));
  }

  edit(newVendorMinimumCharge) {
    return resourceWrapper(this.resource.update({
      id: newVendorMinimumCharge._id,
    }, newVendorMinimumCharge));
  }

  retrieveProviderMinimumCharge(params) {
    const url = lspAwareUrl('provider-minimum-charge');
    return Vue.resource(url, params).get();
  }
}
