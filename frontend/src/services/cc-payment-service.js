import Vue from 'vue';
import BasicService from './basic-service';
import { CcPaymentResource } from '../resources/ar-resources';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';

const COLUMNS = [
  {
    name: 'CC Payment ID', type: 'string', prop: '_id', visible: true,
  },
  {
    name: 'Email', type: 'string', prop: 'email', visible: true,
  },
  {
    name: 'Entity Number', type: 'string', prop: 'entityNo', visible: true,
  },
  {
    name: 'Status', type: 'string', prop: 'status', visible: true,
  },
];

export default class CcPaymentService extends BasicService {
  constructor(resource = CcPaymentResource) {
    super(resource, 'cc-payments', COLUMNS);
  }

  getPaymentStatus(entityNo, query) {
    const url = lspAwareUrl('cc-payments/transaction-search/{entityNo}');
    return resourceWrapper(Vue.resource(url, query).get({ entityNo }));
  }
}
