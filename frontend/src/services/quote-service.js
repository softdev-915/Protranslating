import _ from 'lodash';
import quoteResource from '../resources/quote';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';
import extendColumns from '../utils/shared-columns';

const HUMAN_READABLE_STATUSES = {
  quotationRequired: 'Waiting for Quote',
  open: 'Waiting for approval',
  processed: 'Approved',
};

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Request No', prop: 'no', type: 'string', visible: true,
  },
  {
    name: 'Contact',
    prop: 'contact',
    val: (item) => {
      const name = _.get(item, 'contact.fullName', null);
      if (name) {
        return name;
      }
      if (item.contact) {
        return `${item.contact.firstName} ${item.contact.lastName}`;
      }
      return '';
    },
    type: 'string',
    visible: true,
  },
  {
    name: 'Title', prop: 'title', type: 'string', visible: true,
  },
  {
    name: 'Reception Date', prop: 'receptionDate', type: 'date', visible: true,
  },
  {
    name: 'Delivery Date', prop: 'deliveryDate', type: 'date', visible: true,
  },
  {
    name: 'Price',
    prop: 'totalPrice',
    val: (item) => {
      // request
      if (item.status === 'quotationRequired') {
        return item.price;
      }
      // netsuite quote
      return item.quoteInfo.totalPrice;
    },
    type: 'currency',
    visible: true,
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
    name: 'View',
    prop: 'view',
    style: 'text-align: center',
    type: 'button',
    val: (item) => {
      const status = _.get(item, 'status', null);
      const color = (status === 'quotationRequired') ? '' : 'netsuite';
      const disabled = (status === 'quotationRequired') ? ' disabled' : '';
      // The “view” and “approve” icons show up gray (disabled) if “waiting for quote”
      let link = '#';
      if (item.status !== 'quotationRequired') {
        const quoteId = _.get(item, 'quoteInfo.tranId', '');
        link = (quoteId !== '') ? `/list-quote/${quoteId}` : '#';
      }
      // set properties
      item.className = `btn btn-icon btn-grid binoculars ${color}${disabled}`;
      item.filterName = item.status;
      item.altText = 'View';
      item.iconName = 'fa-binoculars';
      item.link = '#' || link;
      item.operation = 'view';
      return item;
    },
    visible: true,
  },
  {
    name: 'Approve',
    prop: 'approve',
    style: 'text-align: center',
    type: 'button',
    val: (item) => {
      const status = _.get(item, 'status', null);
      const disabled = (status.match('On Hold|quotationRequired')) ? ' disabled' : '';
      // The “view” and “approve” icons show up gray (disabled) if “waiting for quote”
      let icon = '';
      switch (status) {
        case 'quotationRequired':
          icon = 'question';
          break;
        case 'open':
          icon = 'usd';
          break;
        case 'processed':
          icon = 'check';
          break;
        default:
          break;
      }
      let link = '#';
      if (item.status !== 'quotationRequired') {
        const quoteId = _.get(item, 'quoteInfo.tranId', '');
        link = (quoteId !== '') ? `/list-quote/${quoteId}/approve` : '#';
      }
      // set properties
      item.className = `btn btn-icon btn-grid ${icon}${disabled}`;
      item.filterName = item.status;
      item.iconName = `fa-${icon}`;
      item.altText = 'Approve';
      item.link = '#' || link;
      item.operation = 'approve';
      return item;
    },
    visible: true,
  },
]);

export default class QuoteService {
  constructor(resource = quoteResource) {
    this.resource = resource;
  }

  get columns() {
    return COLUMNS;
  }

  retrieve() {
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  retrieveCsv() {
    return lspAwareUrl('quote/export');
  }

  approve(quoteId, quote) {
    return resourceWrapper(this.resource.update({ quoteId: quoteId }, { quoteInfo: quote }));
  }
}
