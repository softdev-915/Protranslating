import customQueryResource from '../resources/custom-query';
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
    name: 'Entities', type: 'string', prop: 'entitiesText', visible: true,
  },
  {
    name: 'Fields', type: 'string', prop: 'fieldsText', visible: true,
  },
  {
    name: 'Filter', type: 'string', prop: 'filterText', visible: true,
  },
  {
    name: 'Group by', type: 'string', prop: 'groupByText', visible: true,
  },
  {
    name: 'Order by', type: 'string', prop: 'orderByText', visible: true,
  },
  {
    name: 'Inactive', type: 'boolean', prop: 'deleted', visible: true,
  },
  {
    name: 'Last CSV result', type: 'component', componentName: 'CustomQueryGridLastResult', visible: true,
  },
  {
    name: 'Last run at', type: 'string', prop: 'lastRunAt', visible: false,
  },
  {
    name: 'Last run by', type: 'string', prop: 'lastRunBy', visible: false,
  },
]);

export default class CustomQueryService {
  constructor(resource = customQueryResource) {
    this.resource = resource;
  }

  get name() {
    return 'custom-query';
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

  create(customQuery) {
    return resourceWrapper(this.resource.save(customQuery));
  }

  edit(customQuery) {
    return resourceWrapper(this.resource.update({ id: customQuery._id }, customQuery));
  }

  retrieveCsv() {
    return lspAwareUrl('custom-query/export');
  }
}
