import translationUnitResource from '../resources/translation-unit';
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

export default class UnitService {
  constructor(resource = translationUnitResource) {
    this.resource = resource;
  }

  get name() {
    return 'translation-unit';
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
    return lspAwareUrl('translation-unit/export');
  }

  create(newUnit) {
    return resourceWrapper(this.resource.save(newUnit));
  }

  edit(newUnit) {
    return resourceWrapper(this.resource.update({ id: newUnit._id }, newUnit));
  }
}
