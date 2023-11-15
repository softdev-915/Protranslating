import breakdownResource from '../resources/breakdown';
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
    name: 'Inactive', type: 'string', prop: 'deletedText', visible: true,
  },
]);

export default class BreakdownService {
  constructor(resource = breakdownResource) {
    this.resource = resource;
  }

  get name() {
    return 'breakdown';
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
    return lspAwareUrl('breakdown/export');
  }

  create(newbreakdown) {
    return resourceWrapper(this.resource.save(newbreakdown));
  }

  edit(newbreakdown) {
    return resourceWrapper(this.resource.update({ id: newbreakdown._id },
      newbreakdown));
  }
}
