import catToolResource from '../resources/cat-tool';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';
import extendColumns from '../utils/shared-columns';

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

export default class CatToolService {
  constructor(resource = catToolResource) {
    this.resource = resource;
  }

  get columns() {
    return COLUMNS;
  }

  get(catToolId) {
    return resourceWrapper(this.resource.get({ catToolId }));
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  retrieveCsv() {
    return lspAwareUrl('cat/export');
  }

  create(catTool) {
    return resourceWrapper(this.resource.save(catTool));
  }

  edit(catTool) {
    return resourceWrapper(this.resource.update({ catToolId: catTool._id }, catTool));
  }
}
