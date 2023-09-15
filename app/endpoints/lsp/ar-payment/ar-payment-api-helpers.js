const _ = require('lodash');

const _getBeforeMatchPipeline = () => [
  {
    $lookup: {
      from: 'companies',
      localField: 'company',
      foreignField: '_id',
      as: 'company',
    },
  },
  {
    $addFields: {
      company: '$company.hierarchy',
      companyId: '$company._id',
    },
  },
];

const _getExtraPipelines = () => [
  {
    $lookup: {
      from: 'bankAccounts',
      localField: 'bankAccount',
      foreignField: '_id',
      as: 'bankAccount',
    },
  },
  {
    $lookup: {
      from: 'paymentMethods',
      localField: 'method',
      foreignField: '_id',
      as: 'method',
    },
  },
  { $unwind: { path: '$bankAccount', preserveNullAndEmptyArrays: true } },
  { $unwind: { path: '$method', preserveNullAndEmptyArrays: true } },
  {
    $addFields: {
      account: {
        $toString: {
          $ifNull: ['$bankAccount.name', '$undepositedAccountIdentifier'],
        },
      },
      amount: { $toString: '$accounting.amount' },
      applied: { $toString: '$accounting.amountApplied' },
      currency: '$accounting.currency.isoCode',
      exchangeRate: { $toString: '$accounting.exchangeRate' },
      isSynced: { $toString: '$siConnector.isSynced' },
      lastSyncDate: { $toString: '$siConnector.connectorEndedAt' },
      localCurrency: '$accounting.localCurrency.isoCode',
      localAmount: { $toString: '$accounting.amountInLocal' },
      total: { $toString: '$accounting.amountTotal' },
      paymentMethod: '$method.name',
      syncError: { $toString: '$siConnector.error' },
      status: {
        $switch: {
          branches: [
            {
              case: { $eq: ['$voidDetails.isVoided', true] },
              then: 'Voided',
            },
          ],
          default: 'Posted',
        },
      },
      ccPaymentList: {
        $cond: {
          if: {
            $and: [
              { $ifNull: ['$target', false] },
              { $gt: [{ $size: ['$target'] }, 0] },
            ],
          },
          then: {
            $map: {
              input: '$target',
              in: '$$this.ccPayment',
            },
          },
          else: [],
        },
      },
    },
  },
  {
    $project: {
      account: 1,
      amount: 1,
      applied: 1,
      company: 1,
      companyId: 1,
      currency: 1,
      createdAt: 1,
      createdBy: 1,
      date: 1,
      docNo: 1,
      description: 1,
      exchangeRate: 1,
      isSynced: 1,
      lastSyncDate: 1,
      localAmount: 1,
      localCurrency: 1,
      total: 1,
      paymentMethod: 1,
      receiptDate: 1,
      syncError: 1,
      status: 1,
      ccPaymentList: 1,
      updatedBy: 1,
      updatedAt: 1,
    },
  },
];
const _getExtraQueryParams = () => [
  'amount',
  'account',
  'applied',
  'company',
  'currency',
  'exchangeRate',
  'isSynced',
  'paymentMethod',
  'lastSyncDate',
  'localAmount',
  'localCurrency',
  'total',
  'syncError',
  'ccPaymentList',
];

const formatLineItem = (item) => {
  const formatted = _.pick(item, ['_id', 'type', 'no', 'date', 'dueDate']);
  formatted.amount = Number(item.accounting.amount);
  formatted.balance = Number(item.accounting.balance);
  formatted.invoice = _.get(item, 'invoice.no');
  return formatted;
};
const isAdjustment = (entityNo) => /IA\d{6}-/g.test(entityNo);
const isInvoice = (entityNo) => /I\d{6}-/g.test(entityNo);
const isAdvance = (entityNo) => /AA\d{6}-/g.test(entityNo);
const newLineItemsQuery = (companyId, currencyId) => ({
  company: companyId,
  'accounting.currency._id': currencyId,
  'siConnector.isSynced': true,
  status: { $ne: 'Paid' },
  'voidDetails.isVoided': { $ne: true },
});

module.exports = {
  _getExtraQueryParams,
  _getExtraPipelines,
  _getBeforeMatchPipeline,
  formatLineItem,
  isAdjustment,
  isInvoice,
  isAdvance,
  DEBIT_MEMO: 'Debit Memo',
  INVOICE: 'Invoice',
  CREDIT_MEMO: 'Credit Memo',
  PAYMENT: 'Payment',
  NON_APPLICABLE_VALUE: 'N/A',
  newLineItemsQuery,
};
