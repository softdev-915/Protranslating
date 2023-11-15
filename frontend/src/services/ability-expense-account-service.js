import abilityExpenseAccountResource from '../resources/ability-expense-account';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';
import lspAwareUrl from '../resources/lsp-aware-url';

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Expense Account',
    type: 'string',
    prop: 'expenseAccount',
    visible: true,
  },
  {
    name: 'Ability',
    type: 'string',
    prop: 'ability',
    visible: true,
  },
  {
    name: 'Inactive', type: 'string', prop: 'deleted', visible: true,
  },
]);

export default class AbilityExpenseAccountService {
  constructor(resource = abilityExpenseAccountResource) {
    this.resource = resource;
  }

  get name() {
    return 'ability-expense-account';
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
    return lspAwareUrl('ability-expense-account/export');
  }

  create(newAbilityExpenseAccount) {
    return resourceWrapper(this.resource.save(newAbilityExpenseAccount));
  }

  edit(newAbilityExpenseAccount) {
    return resourceWrapper(this.resource.update({
      id: newAbilityExpenseAccount._id,
    }, newAbilityExpenseAccount));
  }
}
