
import Vue from 'vue';
import _ from 'lodash';
import { ArInvoiceEntriesResource } from '../resources/ar-resources';
import resourceWrapper from './resource-wrapper';
import localDateTime from '../utils/filters/local-date-time';
import lspAwareUrl from '../resources/lsp-aware-url';

const COLUMNS = [
  { name: 'Request No', type: 'string', prop: 'requestNo', visible: true },
  { name: 'PO #', type: 'string', prop: 'purchaseOrder', visible: true },
  { name: 'External Accounting Code #', type: 'string', prop: 'externalAccountingCode', visible: true },
  { name: 'Company', type: 'string', prop: 'companyName', visible: true },
  { name: 'GL Revenue Account No', type: 'string', prop: 'glAccountNo', visible: true },
  { name: 'Task Name', type: 'string', prop: 'taskName', visible: true },
  { name: 'Task Description', type: 'string', prop: 'requestDescription', visible: true },
  { name: 'Memo', type: 'string', prop: 'memo', visible: true },
  { name: 'Quantity', type: 'string', prop: 'quantity', visible: true },
  { name: 'Price', type: 'string', prop: 'price', visible: true },
  { name: 'Amount', type: 'currency', prop: 'amount', visible: true },
  { name: 'Local Amount', type: 'currency', prop: 'localAmount', visible: false },
  { name: 'Int.Dept', type: 'string', prop: 'internalDepartmentName', visible: true },
  {
    name: 'Request Delivery Date',
    type: 'dateRange',
    val: (item) => localDateTime(item.requestDeliveryDate, 'YYYY-MM-DD HH:mm'),
    prop: 'requestDeliveryDate',
    visible: true,
  },
  {
    name: 'Show', type: 'toggle', prop: 'show', visible: true,
  },
];

export default class ArInvoiceEntriesService {
  constructor({ resource = ArInvoiceEntriesResource, invoice, entries }) {
    this.resource = resource;
    this.invoice = invoice;
    this.entries = entries;
  }

  get name() {
    return 'ar-invoice-entries';
  }

  get columns() {
    return COLUMNS;
  }

  retrieveCsv() {
    const { _id } = this.invoice;
    if (_.isEmpty(_id)) {
      return lspAwareUrl(`${this.name}/export?${new URLSearchParams(this.invoice).toString()}`);
    }
    return lspAwareUrl(`${this.name}/export?id=${_id}`);
  }

  retrieve(params) {
    let invoice = {};
    if (this.invoice._id) {
      invoice._id = this.invoice._id;
    } else {
      this.addShowEntriesIds(params);
      invoice = { ...this.invoice };
    }
    Object.assign(params, invoice);
    return resourceWrapper(this.resource.get({ params }));
  }

  addShowEntriesIds(params) {
    const { entries } = this;
    if (!_.isNil(params.filter)) {
      this.invoice.showEntriesIds = entries
        .filter((entry) => entry.show === params.filter.show);
    } else {
      this.invoice.showEntriesIds = entries;
    }
    this.invoice.showEntriesIds.map((entry) => entry._id);
  }

  uploadCsv(formData, entityName) {
    const url = lspAwareUrl(`entry/${entityName}/import`);
    return resourceWrapper(Vue.http.post(url, formData));
  }
}
