import _ from 'lodash';
import Vue from 'vue';
import { ArInvoiceResource } from '../resources/ar-resources';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';
import BasicService from './basic-service';
import { hasRole } from '../utils/user';

const BASE_URL = 'ar-invoice';
const userLogged = window.store.getters['app/userLogged'];
const COLUMNS = [
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Invoice No', type: 'string', prop: 'no', visible: true,
  },
  {
    name: 'Date', type: 'dateRange', prop: 'date', visible: true,
  },
  {
    name: 'Company Name',
    type: 'string',
    prop: 'companyName',
    visible: true,
    val: (item) => (_.get(item, 'companyName', '')),
  },
  {
    name: 'Status', type: 'string', prop: 'status', visible: true,
  },
  {
    name: 'PO #', type: 'string', prop: 'purchaseOrder', visible: true,
  },
  {
    name: 'Contact Name', type: 'string', prop: 'contactName', visible: true,
  },
  {
    name: 'Due Date', type: 'dateRange', prop: 'dueDate', visible: true,
  },
  {
    name: 'Invoice Total', type: 'currency', prop: 'amount', visible: true,
  },
  {
    name: 'Balance', type: 'currency', prop: 'balance', visible: true,
  },
  {
    name: 'Amount Paid', type: 'currency', prop: 'paid', visible: true,
  },
  {
    name: 'Company ID',
    type: 'string',
    prop: 'companyId',
    visible: false,
    val: (item) => (_.get(item, 'companyId', '')),
  },
  {
    name: 'Status', type: 'string', prop: 'status', visible: true,
  },
  {
    name: 'PO #', type: 'string', prop: 'purchaseOrder', visible: true,
  },
  {
    name: 'Contact Name', type: 'string', prop: 'contactName', visible: true,
  },
  {
    name: 'Due Date', type: 'dateRange', prop: 'dueDate', visible: true,
  },
  {
    name: 'Invoice Total', type: 'currency', prop: 'amount', visible: true,
  },
  {
    name: 'Balance', type: 'currency', prop: 'balance', visible: true,
  },
  {
    name: 'Amount Paid', type: 'currency', prop: 'paid', visible: true,
  },
  {
    name: 'Invoice post completion progress',
    prop: 'creationProgress',
    type: 'string',
    visible: true,
  },
  {
    name: 'Currency',
    type: 'string',
    prop: 'accounting.currency.isoCode',
    visible: true,
    val: (item) => (_.get(item, 'accounting.currency.isoCode', '')),
  },
  {
    name: 'Billing Terms',
    type: 'string',
    prop: 'billingTerm.name',
    visible: true,
    val: (item) => (_.get(item, 'billingTerm.name', '')),
  },
  {
    name: 'Contact Email',
    type: 'string',
    prop: 'contactEmail',
    visible: false,
  },
  {
    name: 'Billing Address',
    type: 'string',
    prop: 'contactBillingAddress',
    visible: false,
    val: (item) => (_.get(item, 'contactBillingAddress', '')),
  },
  {
    name: 'Description', type: 'string', prop: 'description', visible: false,
  },
  {
    name: 'Sales Rep', type: 'string', prop: 'salesRepName', visible: false,
  },
  {
    name: 'Synced', type: 'boolean', prop: 'isSynced', visible: true,
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
    name: 'Requests',
    type: 'string',
    prop: 'requestNoList',
    val: ({ requestNoList = [] }) => _.uniq(requestNoList).join(', '),
    visible: false,
  },
  {
    name: 'Inactive',
    type: 'boolean',
    prop: 'deleted',
    visible: false,
  },
];

if (hasRole(userLogged, 'INVOICE-ACCT_READ_ALL')) {
  COLUMNS.push(
    {
      name: 'Email Template',
      type: 'string',
      prop: 'templates.email.name',
      visible: false,
      val: (item) => (_.get(item, 'templates.email.name', '')),
    },
    {
      name: 'Exchange Rate',
      type: 'currency',
      prop: 'exchangeRate',
      visible: true,
    },
    {
      name: 'GL Posting Date',
      type: 'dateRange',
      prop: 'glPostingDate',
      visible: false,
    },
    {
      name: 'Invoice Template',
      type: 'string',
      prop: 'templates.invoice.name',
      visible: false,
      val: (item) => (_.get(item, 'templates.invoice.name', '')),
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
      prop: 'accounting.localCurrency.isoCode',
      visible: false,
    },
    {
      name: 'Post out of Period',
      type: 'boolean',
      prop: 'postOutOfPeriod',
      visible: false,
    },
    {
      name: 'Send',
      type: 'boolean',
      prop: 'sent',
      visible: true,
    },
  );
}

export default class ArInvoiceService extends BasicService {
  constructor(resource = ArInvoiceResource) {
    super(resource, BASE_URL, COLUMNS);
  }

  getInvoiceActivity(id) {
    const url = lspAwareUrl(`${BASE_URL}/${id}/activity`);
    return resourceWrapper(Vue.http.get(url));
  }

  getFromRequestCurrencyPoLists(companyId) {
    const url = lspAwareUrl(`${BASE_URL}/request-currency-po-lists/${companyId}`);
    return resourceWrapper(Vue.http.get(url));
  }

  getInvoiceTemplate(id, templateId, customFields = {}) {
    const url = lspAwareUrl(`${BASE_URL}/${id}/template/${templateId}`);
    return resourceWrapper(Vue.http.get(url, { params: { customFields } }));
  }
}
