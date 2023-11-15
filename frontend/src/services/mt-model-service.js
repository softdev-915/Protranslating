import mtModelResource from '../resources/mt-model';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';
import lspAwareUrl from '../resources/lsp-aware-url';

const COLUMNS = extendColumns([
  { name: 'ID', type: 'string', prop: '_id', visible: false },
  { name: 'Code', type: 'string', prop: 'code', visible: true },
  { name: 'Last trained', type: 'date', prop: 'lastTrainedAt', visible: true },
  { name: 'Source language', type: 'string', prop: 'sourceLanguage.name', visible: true },
  { name: 'Target language', type: 'string', prop: 'targetLanguage.name', visible: true },
  { name: 'General', type: 'boolean', prop: 'isGeneral', visible: true },
  { name: 'Industry', type: 'string', prop: 'industry', visible: true },
  { name: 'Client',
    type: 'string',
    prop: 'client',
    visible: true,
    val: (item) => {
      if (item.client.hierarchy !== '') {
        return item.client.hierarchy;
      }
      return item.client.name;
    },
  },
  { name: 'Inactive', type: 'string', prop: 'deletedText', visible: true },
  { name: 'Production Ready', type: 'boolean', prop: 'isProductionReady', visible: true },
]);

export default class MtModelService {
  constructor(resource = mtModelResource) {
    this.resource = resource;
  }

  get name() {
    return 'mt-model';
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
    return lspAwareUrl('mt-model/export');
  }

  create(newMtModel) {
    return resourceWrapper(this.resource.save(newMtModel));
  }

  edit(newMtModel) {
    return resourceWrapper(this.resource.update({
      id: newMtModel._id,
    }, newMtModel));
  }
}
