import { ArAdjustmentResource } from '../resources/ar-resources';
import BasicService from './basic-service';
import { hasRole } from '../utils/user';

const userLogged = window.store.getters['app/userLogged'];
const COLUMNS = [
  {
    name: 'Adjustment #',
    type: 'string',
    prop: 'no',
    visible: true,
  },
  {
    name: 'Ref. Invoice #',
    type: 'string',
    prop: 'invoiceNo',
    visible: true,
  },
  {
    name: 'Adjustment Date',
    type: 'dateRange',
    prop: 'date',
    visible: true,
  },
  {
    name: 'Type',
    type: 'string',
    prop: 'type',
    visible: true,
  },
  {
    name: 'Status',
    type: 'string',
    prop: 'status',
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
    name: 'Company ID',
    type: 'string',
    prop: 'companyId',
    visible: false,
  },
  {
    name: 'Contact',
    type: 'string',
    prop: 'contact',
    visible: false,
  },
  {
    name: 'Contact ID',
    type: 'string',
    prop: 'contactId',
    visible: false,
  },
  {
    name: 'Currency',
    type: 'string',
    prop: 'currency',
    visible: true,
  },
  {
    name: 'Adjustment Balance',
    type: 'currency',
    prop: 'balance',
    visible: true,
  },
  {
    name: 'Amount Paid',
    type: 'currency',
    prop: 'paid',
    visible: true,
  },
  {
    name: 'Adjustment Total',
    type: 'currency',
    prop: 'total',
    visible: true,
  },
  {
    name: 'Description',
    type: 'string',
    prop: 'description',
    visible: false,
  },
  {
    name: 'ID',
    type: 'string',
    prop: '_id',
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
    name: 'Contact',
    type: 'string',
    prop: 'contact',
    visible: false,
  },
];

if (hasRole(userLogged, 'AR-ADJUSTMENT-ACCT_READ_ALL')) {
  COLUMNS.push(
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
      name: 'GL Posting date',
      type: 'dateRange',
      prop: 'glPostingDate',
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
export default class ArAdjustmentService extends BasicService {
  constructor(resource = ArAdjustmentResource) {
    super(resource, 'ar-adjustment', COLUMNS);
  }
}
