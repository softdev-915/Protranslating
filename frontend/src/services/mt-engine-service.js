import mtEngineResource from '../resources/mt-engine';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';
import lspAwareUrl from '../resources/lsp-aware-url';

const COLUMNS = extendColumns([
  { name: 'ID', type: 'string', prop: '_id', visible: false },
  { name: 'MT name', type: 'string', prop: 'mtProvider', visible: true },
  { name: 'API key', type: 'string', prop: 'apiKey', visible: true },
  { name: 'Inactive', type: 'string', prop: 'deletedText', visible: true },
]);

export default class MtEngineService {
  constructor(resource = mtEngineResource) {
    this.resource = resource;
  }

  get name() {
    return 'mt-engine';
  }

  get columns() {
    return COLUMNS;
  }

  get(id) {
    return resourceWrapper(this.resource.query({ id }));
  }

  retrieve(params) {
    this.params = Object.assign({}, this.params, params);
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  retrieveCsv() {
    return lspAwareUrl('mt-engine/export');
  }

  create(newMtEngine) {
    return resourceWrapper(this.resource.save(newMtEngine));
  }

  edit(newMtEngine) {
    return resourceWrapper(this.resource.update({ id: newMtEngine._id }, newMtEngine));
  }
}
