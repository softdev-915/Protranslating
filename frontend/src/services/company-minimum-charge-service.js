import companyMinimumChargeResource from '../resources/company-minimum-charge';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';
import extendColumns from '../utils/shared-columns';

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Company',
    type: 'string',
    prop: 'companyHierarchy',
    val: (item) => {
      if (item.company.hierarchy !== '') {
        return item.company.hierarchy;
      }
      return item.company.name;
    },
    visible: true,
  },
  {
    name: 'Ability',
    type: 'string',
    prop: 'abilityText',
    visible: true,
  },
  {
    name: 'Languages',
    type: 'longtext',
    prop: 'languageCombinationsText',
    visible: true,
  },
  {
    name: 'Minimum Charge Rate',
    type: 'string',
    prop: 'minCharge',
    visible: true,
  },
  {
    name: 'Currency',
    type: 'string',
    prop: 'currency.isoCode',
    visible: true,
  },
  {
    name: 'Inactive', type: 'string', prop: 'inactiveText', visible: true,
  },
]);

export default class CompanyMinimumChargeService {
  constructor(resource = companyMinimumChargeResource) {
    this.resource = resource;
  }

  get name() {
    return 'companyMinimumCharge';
  }

  get columns() {
    return COLUMNS;
  }

  get(companyMinimumChargeId) {
    return resourceWrapper(this.resource.get({ companyMinimumChargeId }));
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  getMinCharge(params) {
    this.params = { ...this.params, ...params };
    Object.assign(this.params, { minCharge: 'min-charge' });
    return resourceWrapper(this.resource.get(this.params));
  }

  retrieveCsv() {
    return lspAwareUrl('company-minimum-charge/export');
  }

  create(companyMinimumCharge) {
    return resourceWrapper(this.resource.save(companyMinimumCharge));
  }

  edit(companyMinimumCharge) {
    return resourceWrapper(this.resource.update({
      companyMinimumChargeId:
      companyMinimumCharge._id,
    }, companyMinimumCharge));
  }
}
