import Vue from 'vue';
import _ from 'lodash';
import billResource from '../resources/bill';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';
import lspAwareUrl from '../resources/lsp-aware-url';
import { hasRole } from '../utils/user';

const BILL_HUMAN_READABLE_STATUSES = {
  posted: 'Posted',
  paid: 'Paid',
  partiallyPaid: 'Partially Paid',
};

const BILL_READ_OWN_COLUMNS = extendColumns([
  {
    name: 'Bill ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Bill No.', type: 'string', prop: 'no', visible: true,
  },
  {
    name: 'Request Numbers', type: 'string', prop: 'requestNumbersText', visible: true,
  },
  {
    name: 'Status',
    type: 'string',
    prop: 'status',
    visible: true,
    val: ({ status }) => _.get(BILL_HUMAN_READABLE_STATUSES, status),
  },
  {
    name: 'Bill Date', type: 'string', prop: 'date', visible: true,
  },
  {
    name: 'Due Date', type: 'string', prop: 'dueDate', visible: true,
  },
  {
    name: 'Vendor Name', type: 'string', prop: 'vendorName', visible: true, disabled: true,
  },
  {
    name: 'Bill Balance', type: 'currency', visible: true, prop: 'balance',
  },
  {
    name: 'Amount Paid', type: 'currency', prop: 'amountPaid', visible: true,
  },
  {
    name: 'Total Amount', type: 'currency', visible: true, prop: 'totalAmount',
  },
  {
    name: 'Updated at', type: 'string', prop: 'updatedAt', visible: true,
  },
]);

const COLUMNS = extendColumns([
  {
    name: 'Bill ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Bill No.', type: 'string', prop: 'no', visible: true,
  },
  {
    name: 'Request Numbers', type: 'string', prop: 'requestNumbersText', visible: true,
  },
  {
    name: 'Bill Date', type: 'string', prop: 'date', visible: true,
  },
  {
    name: 'Due Date', type: 'string', prop: 'dueDate', visible: true,
  },
  {
    name: '1099', type: 'string', val: (item) => _.defaultTo(item.has1099EligibleForm, false), prop: 'has1099EligibleForm', visible: true,
  },
  {
    name: 'Payment Schedule Date', type: 'string', prop: 'paymentScheduleDate', visible: false,
  },
  {
    name: 'Status',
    type: 'string',
    prop: 'status',
    visible: true,
    val: ({ status }) => _.get(BILL_HUMAN_READABLE_STATUSES, status),
  },
  {
    name: 'GL Posting Date', type: 'string', prop: 'glPostingDate', visible: true,
  },
  {
    name: 'Synced',
    type: 'string',
    prop: 'isSyncedText',
    val: (item) => _.defaultTo(item.isSyncedText, false),
    visible: true,
  },
  {
    name: 'Sync Error',
    type: 'string',
    prop: 'siConnector.error',
    visible: false,
    val: (item) => _.get(item, 'siConnector.error', ''),
  },
  {
    name: 'Last Sync Date',
    type: 'date',
    prop: 'siConnector.connectorEndedAt',
    visible: false,
    val: (item) => _.get(item, 'siConnector.connectorEndedAt', ''),
  },
  {
    name: 'Vendor Name', type: 'string', prop: 'vendorName', visible: true,
  },
  {
    name: 'Vendor ID', type: 'string', prop: 'vendorId', visible: false,
  },
  {
    name: 'Vendor Email', type: 'string', prop: 'vendorEmail', visible: false,
  },
  {
    name: 'Billing Address', type: 'string', prop: 'billingAddress', visible: false,
  },
  {
    name: 'Vendor Company', type: 'string', prop: 'vendorCompany', visible: false,
  },
  {
    name: 'Payment method', type: 'string', prop: 'vendorPaymentMethodName', visible: false,
  },
  {
    name: 'WT Fee Waived', type: 'string', prop: 'vendorWtFeeWaived', visible: false,
  },
  {
    name: 'Billing Terms', type: 'string', prop: 'billingTerms.name', visible: false,
  },
  {
    name: 'Bill On Hold', type: 'string', prop: 'billOnHoldText', visible: false,
  },
  {
    name: 'Priority Pay', type: 'string', prop: 'vendorPriorityPay', visible: false,
  },
  {
    name: 'Bill Payment Notes', type: 'string', prop: 'vendorBillPaymentNotes', visible: false,
  },
  {
    name: 'Bill Balance', type: 'currency', visible: true, prop: 'balance',
  },
  {
    name: 'Amount Paid', type: 'currency', prop: 'amountPaid', visible: true,
  },
  {
    name: 'Total Amount', type: 'currency', visible: true, prop: 'totalAmount',
  },
  {
    name: 'Updated at', type: 'string', prop: 'updatedAt', visible: true,
  },
  {
    name: 'Bill Scheduler Type', type: 'string', prop: 'schedulerType', visible: false,
  },
]);

const FILES_DEFAULT_COLUMNS = [
  { name: 'Filename', visible: true },
  { name: 'Created At', visible: true },
  { name: 'Uploaded By', visible: true },
  { name: 'Deleted At', visible: true },
  { name: 'Deleted By', visible: true },
  { name: 'Size', visible: true },
  { name: 'Download', visible: true },
  { name: 'Remove', visible: true },
];

export default class BillService {
  constructor(userLogged, resource = billResource) {
    this.resource = resource;
    this.userLogged = userLogged;
  }

  get defaultFileColumns() {
    return FILES_DEFAULT_COLUMNS;
  }

  get name() {
    return 'bill';
  }

  get columns() {
    return !hasRole(this.userLogged, 'BILL_READ_ALL') ? BILL_READ_OWN_COLUMNS : COLUMNS;
  }

  get(id) {
    return resourceWrapper(this.resource.query({ id }));
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  retrieveByIds(ids) {
    return resourceWrapper(this.resource.get({ ids }));
  }

  retrieveCsv() {
    return lspAwareUrl('bill/export');
  }

  create(newUnit) {
    return resourceWrapper(this.resource.save(newUnit));
  }

  edit(newUnit) {
    return resourceWrapper(this.resource.update({ id: newUnit._id }, newUnit));
  }

  uploadDocument(formData, fileParams) {
    const endpointUrl = lspAwareUrl(`bill/${fileParams.billId}/document`, fileParams);
    return resourceWrapper(Vue.http.post(endpointUrl, formData));
  }

  approveBill(billId) {
    const url = lspAwareUrl(`bill/${billId}/approve`);
    return resourceWrapper(Vue.http.put(url));
  }

  getDocumentUrl(billId, documentId) {
    const documentEndpoint = `bill/${billId}/document/${documentId}`;
    return lspAwareUrl(documentEndpoint);
  }

  deleteDocument(documentId, billId) {
    const endpointUrl = lspAwareUrl(`bill/${billId}/document/${documentId}`);
    return resourceWrapper(Vue.http.delete(endpointUrl));
  }

  getDocumentDownloadUrl(documentUrl) {
    return resourceWrapper(Vue.http.get(documentUrl));
  }

  getBillFilesZipUrl(billId) {
    const billDocumentsUrl = lspAwareUrl(
      `bill/${billId}/documents/src/zip`,
    );
    return billDocumentsUrl;
  }

  createBills(scheduler, params) {
    let url = `bill/${scheduler.name}/vendor`;
    if (params.entityId) {
      url += `?vendorId=${params.entityId}`;
    }
    return resourceWrapper(Vue.http.put(lspAwareUrl(url)));
  }

  getBillPreview(billId, templateId) {
    const url = lspAwareUrl(`bill/${billId}/preview/${templateId}`);
    return resourceWrapper(Vue.http.get(url));
  }
}
