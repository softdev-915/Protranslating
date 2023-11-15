import Vue from 'vue';
import lspAwareUrl from '../resources/lsp-aware-url';
import resourceWrapper from './resource-wrapper';
import ApPaymentService from './ap-payment-service';
import accountPayableResource from '../resources/account-payable';
import extendColumns from '../utils/shared-columns';

const STATUS_NAMES = { posted: 'Posted', partiallyPaid: 'Partially paid', paid: 'Paid' };
const PAYABLE_GRID_COLUMNS = extendColumns([
  { name: 'Applied To', type: 'string', prop: 'no', visible: true },
  { name: 'Due Date', type: 'dateRange', prop: 'dueDate', visible: true },
  { name: 'Ref. Bill #', type: 'string', prop: 'billNo', visible: true },
  { name: 'Vendor ID', type: 'string', prop: 'vendorId', visible: true },
  { name: 'Vendor Name', type: 'string', prop: 'vendorName', visible: true },
  {
    name: 'Status',
    type: 'string',
    prop: 'status',
    val: ({ status }) => STATUS_NAMES[status],
    visible: true,
  },
  {
    name: 'Credits available', type: 'currency', prop: 'creditsAvailable', visible: true,
  },
  {
    name: 'Credits to Apply',
    type: 'component',
    prop: 'creditsToApply',
    componentName: 'ApPaymentValueEdit',
    visible: true,
  },
  {
    name: 'Bill Balance', type: 'currency', prop: 'billBalance', visible: true,
  },
  {
    name: 'Payment method', type: 'string', prop: 'paymentMethod', visible: true,
  },
  {
    name: 'Payment amount',
    type: 'component',
    prop: 'paymentAmount',
    componentName: 'ApPaymentValueEdit',
    visible: true,
  },
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Applied To Type', type: 'string', prop: 'appliedToType', visible: false,
  },
]);

export default class AccountPayableService extends ApPaymentService {
  constructor() {
    super(null, accountPayableResource);
  }

  get columns() {
    return PAYABLE_GRID_COLUMNS;
  }

  uploadCsv(formData, entityName) {
    const url = lspAwareUrl(`entry/${entityName}/import`);
    return resourceWrapper(Vue.http.post(url, formData));
  }

  retrieveCsv() {
    return lspAwareUrl('ap-payment/account-payable/export');
  }
}
