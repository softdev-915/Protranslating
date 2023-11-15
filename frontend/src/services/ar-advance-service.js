import Vue from 'vue';
import BasicService from './basic-service';
import { ArAdvanceResource } from '../resources/ar-resources';
import { hasRole } from '../utils/user';
import lspAwareUrl from '../resources/lsp-aware-url';
import resourceWrapper from './resource-wrapper';

const userLogged = window.store.getters['app/userLogged'];
const COLUMNS = [
  {
    name: 'ID',
    type: 'string',
    prop: '_id',
    visible: true,
  },
  {
    name: 'Advance No.',
    type: 'string',
    prop: 'no',
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
    name: 'Receipt Date',
    type: 'dateRange',
    prop: 'receiptDate',
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
    name: 'Payment Amount',
    type: 'currency',
    prop: 'amount',
    visible: true,
  },
  {
    name: 'Amount Applied',
    type: 'currency',
    prop: 'applied',
    visible: true,
  },
  {
    name: 'Amount Available',
    type: 'currency',
    prop: 'balance',
    visible: true,
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
    name: 'Applied To',
    type: 'string',
    prop: 'appliedTo',
    visible: false,
  },
  {
    name: 'Last Sync Date',
    type: 'date',
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
    name: 'Status',
    type: 'string',
    prop: 'status',
    visible: false,
  },
  {
    name: 'Currency',
    type: 'string',
    prop: 'currency',
    visible: true,

  },
  {
    name: 'Created By',
    type: 'string',
    prop: 'createdBy',
    visible: true,
  },
];

if (hasRole(userLogged, 'AR-PAYMENT-ACCT_READ_ALL')) {
  COLUMNS.push(
    {
      name: 'Bank Account',
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
    {
      name: 'Local Currency',
      type: 'string',
      prop: 'localCurrency',
      visible: false,
    },
  );
}

export default class AdvanceService extends BasicService {
  constructor(resource = ArAdvanceResource) {
    super(resource, 'ar-advance', COLUMNS);
  }

  void(id, data) {
    const url = lspAwareUrl(`ar-advance/${id}/void`);
    return resourceWrapper(Vue.http.put(url, data));
  }
}
