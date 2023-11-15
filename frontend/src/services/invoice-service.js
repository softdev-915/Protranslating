import Vue from 'vue';
import moment from 'moment';
import invoiceResource from '../resources/invoice';
import lspAwareUrl from '../resources/lsp-aware-url';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';
// import _ from 'lodash';

const HUMAN_READABLE_STATUSES = {
  paidInFull: 'Paid in full',
  open: 'Pending Payment',
};

const COLUMNS = extendColumns([
  {
    name: 'Request No', prop: 'no', type: 'string', visible: true,
  },
  {
    name: 'Issued Date', prop: 'receptionDate', type: 'date', visible: true,
  },
  {
    name: 'Delivery Date',
    prop: 'deliveryDate',
    type: 'date',
    visible: true,
    alias: {
      fromDeliveryDate: (item, value) => {
        const filter = moment(value).utc();
        if (item.deliveryDate && filter.isValid()) {
          const deliveryDate = moment(item.deliveryDate);
          return filter.diff(deliveryDate, 'minutes') <= 0;
        }
        return false;
      },
    },
  },
  {
    name: 'Invoice No', prop: 'transactionNumber', type: 'string', visible: true,
  },
  {
    name: 'P/O Check', prop: 'pocheck', type: 'string', visible: true,
  },
  {
    name: 'Status',
    prop: 'status',
    alias: 'status',
    type: 'string',
    val: (item) => HUMAN_READABLE_STATUSES[item.status] || item.status,
    visible: true,
  },
  {
    name: 'Amount', prop: 'total', type: 'currency', visible: true,
  },
]);

export default class RequestService {
  constructor(resource = invoiceResource) {
    this.resource = resource;
  }

  get columns() {
    return COLUMNS;
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  retrieveCsv() {
    return lspAwareUrl('invoice/export');
  }

  retrieveById(invoiceId) {
    return resourceWrapper(this.resource.get({ invoiceId }));
  }

  reverse(invoiceId, { memo, reversedOnDate }) {
    const url = lspAwareUrl(`ar-invoice/${invoiceId}/reverse`);
    return resourceWrapper(Vue.http.put(url, { memo, reversedOnDate }));
  }
}
