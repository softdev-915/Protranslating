import providerInstructionResource from '../resources/provider-instruction';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';
import lspAwareUrl from '../resources/lsp-aware-url';

const COLUMNS = extendColumns([
  { name: 'ID', type: 'string', prop: '_id', visible: false },
  { name: 'Name', type: 'string', prop: 'name', visible: true },
  { name: 'Body', type: 'longtext', prop: 'body', visible: true },
  { name: 'Inactive', type: 'string', prop: 'deletedText', visible: true },
]);

export default class ProviderInstructionsService {
  constructor(resource = providerInstructionResource) {
    this.resource = resource;
  }

  get name() {
    return 'provider-instruction';
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
    return lspAwareUrl('provider-instruction/export');
  }

  create(providerInstruction) {
    return resourceWrapper(this.resource.save(providerInstruction));
  }

  edit(providerInstruction) {
    return resourceWrapper(this.resource.update({ id: providerInstruction._id }
      , providerInstruction));
  }
}
