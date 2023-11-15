import expenseAccountResource from '../resources/expense-account';
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
    name: 'Number', type: 'string', prop: 'number', visible: true,
  },
  {
    name: 'Cost Type', type: 'string', prop: 'costType', visible: true,
  },
  {
    name: 'Inactive', type: 'string', prop: 'deleted', visible: true,
  },
]);

export default class ExpenseAccountService {
  constructor(resource = expenseAccountResource) {
    this.resource = resource;
  }

  get name() {
    return 'expense-account';
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
    return lspAwareUrl('expense-account/export');
  }

  create(newExpenseAccount) {
    return resourceWrapper(this.resource.save(newExpenseAccount));
  }

  edit(newExpenseAccount) {
    return resourceWrapper(this.resource.update({ id: newExpenseAccount._id }, newExpenseAccount));
  }
}
