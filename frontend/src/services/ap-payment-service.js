import _ from 'lodash';
import apPaymentResource from '../resources/ap-payment';
import resourceWrapper from './resource-wrapper';
import BasicService from './basic-service';

const HUMAN_READABLE_STATUS_LIST = {
  posted: 'Posted',
  partiallyPaid: 'Partially Paid',
  paid: 'Paid',
  inProgress: 'In Progress',
  voided: 'Voided',
  Voided: 'Voided',
  drafted: 'Drafted',
};
const STATUS_LIST = {
  Posted: 'posted',
  'Partially Paid': 'partiallyPaid',
  Paid: 'paid',
  Voided: 'voided',
  voided: 'voided',
  'In Progress': 'inProgress',
  Drafted: 'drafted',
};

const COLUMNS = [
  {
    name: 'Vendor Name', type: 'string', prop: 'vendorName', visible: true,
  },
  {
    name: 'Vendor PT Pay/Paypal/Veem',
    type: 'string',
    prop: 'ptPayOrPayPal',
    visible: true,
  },
  {
    name: 'Synced', type: 'string', prop: 'isSynced', visible: true,
  },
  {
    name: 'Sync Error', type: 'string', prop: 'syncError', visible: true,
  },
  {
    name: 'Payment Date', type: 'string', prop: 'paymentDate', visible: true,
  },
  {
    name: 'Payment Method', type: 'string', prop: 'paymentMethod', visible: true,
  },
  {
    name: 'Bank Account', type: 'string', prop: 'bankAccount', visible: true,
  },
  {
    name: 'Total Payment Amount', type: 'currency', prop: 'totalPaymentAmount', visible: true,
  },
  {
    name: 'Total Applied Credit', type: 'currency', prop: 'totalAppliedCredit', visible: true,
  },
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Last Sync Date',
    type: 'date',
    prop: 'lastSyncDate',
    visible: false,
  },
  {
    name: 'Status',
    type: 'string',
    prop: 'status',
    val: apPayment => HUMAN_READABLE_STATUS_LIST[apPayment.status],
    visible: false,
  },
  {
    name: 'Vendor Address', type: 'string', prop: 'vendorAddress', visible: false,
  },
  {
    name: 'Vendor City',
    type: 'string',
    prop: 'vendorCity',
    visible: false,
  },
  {
    name: 'Vendor Country',
    type: 'string',
    prop: 'vendorCountry',
    visible: false,
  },
  {
    name: 'Vendor ID', type: 'string', prop: 'vendor', visible: false,
  },
  {
    name: 'Vendor State',
    type: 'string',
    prop: 'vendorState',
    visible: false,
  },
  {
    name: 'Vendor Zip', type: 'string', prop: 'vendorZip', visible: false,
  },
  {
    name: 'Applied to', type: 'string', prop: 'appliedToNoText', visible: false,
  },
  {
    name: 'Applied to Type', type: 'string', prop: 'appliedToTypeText', visible: false,
  },
];

export default class ApPaymentService extends BasicService {
  constructor(userLogged, resource = apPaymentResource) {
    super(resource, 'apPayment', COLUMNS);
    this.userLogged = userLogged;
  }

  create(apPayment) {
    return resourceWrapper(this.resource.save(apPayment));
  }

  void(id, data) {
    return resourceWrapper(this.resource.update({ id, action: 'void' }, data));
  }

  retrieve(params) {
    if (_.has(params.status)) {
      params.status = _.get(STATUS_LIST, params.status);
    }
    return resourceWrapper(this.resource.get({ params }));
  }

  humanReadableStatusList() {
    return HUMAN_READABLE_STATUS_LIST;
  }

  statusList() {
    return STATUS_LIST;
  }
}
