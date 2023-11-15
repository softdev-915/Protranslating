import abilityResource from '../resources/ability';
import lspAwareUrl from '../resources/lsp-aware-url';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Name', type: 'string', prop: 'name', visible: true,
  },
  {
    name: 'Description', type: 'string', prop: 'description', visible: true,
  },
  {
    name: 'Revenue GL Account Number', type: 'string', prop: 'glAccountNo', visible: true,
  },
  {
    name: 'Language Combination Required', type: 'string', prop: 'languageCombinationText', visible: true,
  },
  {
    name: 'Tool Required', type: 'string', prop: 'catToolText', visible: true,
  },
  {
    name: 'Competence Level Required', type: 'string', prop: 'competenceLevelRequiredText', visible: true,
  },
  {
    name: 'Inactive', type: 'string', prop: 'deletedText', visible: true,
  },
  {
    name: 'Internal Department Required', type: 'string', prop: 'internalDepartmentRequiredText', visible: true,
  },
  {
    name: 'Company Required', type: 'string', prop: 'companyRequiredText', visible: true,
  },
]);

export default class AbilityService {
  constructor(resource = abilityResource) {
    this.resource = resource;
  }

  get name() {
    return 'ability';
  }

  get columns() {
    return COLUMNS;
  }

  get(abilityId) {
    return resourceWrapper(this.resource.get({ abilityId }));
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  retrieveCsv() {
    return lspAwareUrl('ability/export');
  }

  create(ability) {
    return resourceWrapper(this.resource.save(ability));
  }

  edit(ability) {
    return resourceWrapper(this.resource.update({ abilityId: ability._id }, ability));
  }
}
