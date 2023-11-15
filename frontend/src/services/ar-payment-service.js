import Vue from 'vue';
import BasicService from './basic-service';
import { ArPaymentResource } from '../resources/ar-resources';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';
import { hasRole } from '../utils/user';

const userLogged = window.store.getters['app/userLogged'];
const COLUMNS = [
  {
    name: 'ID',
    type: 'string',
    prop: '_id',
    visible: true,
  },
  {
    name: 'Payment Method',
    type: 'string',
    prop: 'paymentMethod',
    visible: true,
  },
  {
    name: 'Payment Date',
    type: 'dateRange',
    prop: 'date',
    visible: true,
  },
  {
    name: 'Synced',
    type: 'string',
    prop: 'isSynced',
    visible: true,
  },
  {
    name: 'Company',
    type: 'string',
    prop: 'company',
    visible: true,
  },
  {
    name: 'Company ID', type: 'string', prop: 'companyId', visible: true,
  },
  {
    name: 'Payment Amount',
    type: 'currency',
    prop: 'amount',
    visible: true,
  },
  {
    name: 'Currency',
    type: 'string',
    prop: 'currency',
    visible: true,
  },
  {
    name: 'Credits Applied',
    type: 'currency',
    prop: 'applied',
    visible: false,
  },
  {
    name: 'Total Amount Applied',
    type: 'currency',
    prop: 'total',
    visible: false,
  },
  {
    name: 'Description',
    type: 'string',
    prop: 'description',
    visible: false,
  },
  {
    name: 'Document Number',
    type: 'string',
    prop: 'docNo',
    visible: false,
  },
  {
    name: 'Received Date',
    type: 'dateRange',
    prop: 'receiptDate',
    visible: false,
  },
  {
    name: 'Last Sync Date',
    type: 'dateRange',
    prop: 'lastSyncDate',
    visible: false,
  },
  {
    name: 'Sync Error',
    type: 'string',
    prop: 'syncError',
    visible: false,
  },
  {
    name: 'Local Currency',
    type: 'string',
    prop: 'localCurrency',
    visible: false,
  },
  {
    name: 'Status',
    type: 'string',
    prop: 'status',
    visible: false,
  },
  {
    name: 'CC Payment ID',
    type: 'string',
    prop: 'ccPaymentList',
    val: ({ ccPaymentList = [] }) => ccPaymentList.join(', '),
    visible: false,
  },
];

if (hasRole(userLogged, 'AR-PAYMENT-ACCT_READ_ALL')) {
  COLUMNS.push(
    {
      name: 'Bank account',
      type: 'string',
      prop: 'account',
      visible: false,
    },
    {
      name: 'Exchange rate',
      type: 'currency',
      prop: 'exchangeRate',
      visible: false,
    },
    {
      name: 'Local Amount',
      type: 'currency',
      prop: 'localAmount',
      visible: false,
    },
  );
}

export default class PaymentService extends BasicService {
  constructor(resource = ArPaymentResource) {
    super(resource, 'ar-payment', COLUMNS);
  }

  retrieveLineItems(params) {
    const url = lspAwareUrl('ar-payment/line-items/');
    return resourceWrapper(Vue.resource(url, params).get());
  }

  void(id, data) {
    const url = lspAwareUrl(`ar-payment/${id}/void`);
    return resourceWrapper(Vue.http.put(url, data));
  }
}
