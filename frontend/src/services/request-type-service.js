import requestTypeResource from '../resources/request-type';
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

export default class RequestTypeService {
  constructor(resource = requestTypeResource) {
    this.resource = resource;
  }

  get name() {
    return 'requestType';
  }

  get columns() {
    return COLUMNS;
  }

  get(requestTypeId) {
    return resourceWrapper(this.resource.get({ requestTypeId }));
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  retrieveCsv() {
    return lspAwareUrl('request-type/export');
  }

  create(language) {
    return resourceWrapper(this.resource.save(language));
  }

  edit(requestType) {
    return resourceWrapper(this.resource.update({ requestTypeId: requestType._id }, requestType));
  }
}
