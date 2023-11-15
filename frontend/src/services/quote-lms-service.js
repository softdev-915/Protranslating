import _ from 'lodash';
import quoteLmsResource from '../resources/quote-lms';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';
import extendColumns from '../utils/shared-columns';
import CommonService from './common-service';

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
    prop: 'contactName',
    val: (item) => `${_.get(item, 'contact.firstName')} ${_.get(item, 'contact.lastName')}`,
    type: 'string',
    visible: true,
  },
  {
    name: 'Title', prop: 'title', type: 'string', visible: true,
  },
  {
    name: 'Reception Date', prop: 'receptionDate', type: 'string', visible: true,
  },
  {
    name: 'Delivery Date', prop: 'deliveryDate', type: 'string', visible: true,
  },
  {
    name: 'Price',
    prop: 'foreignInvoiceTotal',
    val: (item) => _.get(item, 'foreignInvoiceTotal.$numberDecimal', 0),
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
    name: 'Request Type',
    prop: 'requestType.name',
    alias: 'requestType',
    type: 'string',
    val: (item) => _.get(item, 'requestType.name', ''),
    visible: true,
  },
  {
    name: 'View',
    prop: 'view',
    style: 'text-align: center',
    type: 'button',
    val: (item) => {
      const status = _.get(item, 'status', null);
      const color = (status === 'Waiting for approval') ? 'blue' : '';
      const disabled = (status === HUMAN_READABLE_STATUSES.quotationRequired) ? 'disabled' : '';
      if (item.status !== HUMAN_READABLE_STATUSES.quotationRequired) {
        const requestId = _.get(item, '_id', '');
        item.link = (requestId !== '') ? `/requests/${requestId}/details/quote/` : '#';
      }
      Object.assign(item, {
        className: `btn btn-icon btn-grid binoculars ${color} ${disabled}`,
        filterName: item.status,
        disabled: disabled,
        operation: 'view',
        altText: 'View',
        iconName: 'fa-binoculars',
      });
      return item;
    },
    visible: false,
  },
]);

export default class QuoteLmsService extends CommonService {
  constructor(resource = quoteLmsResource) {
    super(resource);
    this.gridColumns = COLUMNS;
  }

  get columns() {
    return this.gridColumns;
  }

  set columns(newColumns) {
    this.gridColumns = newColumns;
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  getDetail(quoteId) {
    return resourceWrapper(this.resource.get({ quoteId }));
  }

  retrieveCsv() {
    return lspAwareUrl('quote-lms/export');
  }

  approve(quoteId, quote) {
    return resourceWrapper(this.resource.update({ quoteId: quoteId }, { quoteInfo: quote }));
  }
}
