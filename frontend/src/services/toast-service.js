import toastResource from '../resources/toast';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';
import extendColumns from '../utils/shared-columns';

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Title', type: 'string', prop: 'title', visible: true,
  },
  {
    name: 'Message', type: 'string', prop: 'message', visible: true,
  },
  {
    name: 'Users', type: 'array', prop: 'usersName', visible: true,
  },
  {
    name: 'From', type: 'string', prop: 'from', visible: true,
  },
  {
    name: 'To', type: 'string', prop: 'to', visible: true,
  },
  {
    name: 'Require Dismiss', type: 'boolean', prop: 'requireDismiss', visible: true,
  },
  {
    name: 'Inactive', type: 'boolean', prop: 'deleted', visible: true,
  },
]);

export default class ToastService {
  constructor(resource = toastResource) {
    this.resource = resource;
  }

  get columns() {
    return COLUMNS;
  }

  get(toastId) {
    return resourceWrapper(this.resource.get({ toastId }));
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.query({ params: this.params }));
  }

  retrieveCsv() {
    return lspAwareUrl('toast/export');
  }

  create(toast) {
    return resourceWrapper(this.resource.save(toast));
  }

  edit(toast) {
    return resourceWrapper(this.resource.update({ toastId: toast._id }, toast));
  }
}
