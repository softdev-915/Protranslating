
const PAYMENT = 'Payment';
const CREDIT_MEMO = 'Credit Memo';
const ADVANCE = 'Advance';
const DEBIT_MEMO = 'Debit Memo';
const INVOICE = 'Invoice';
const BANK_ACCOUNT = 'Bank Account';
const UNDEPOSITED = 'Undeposited Funds Account Identifier';
const TARGET_OPTIONS = [DEBIT_MEMO, INVOICE];
const SOURCE_OPTIONS = [PAYMENT, CREDIT_MEMO, ADVANCE];
const INVOICES_ENTITY_TYPE = 'invoices';
const ADVANCE_ENTITY_TYPE = 'advances';
const CREDIT_MEMO_ENTITY_TYPE = 'creditMemos';
const DEBIT_MEMO_ENTITY_TYPE = 'debitMemos';
const formatters = {
  paymentMethod: ({ name, _id }) => ({ text: name, value: _id }),
  bankAccount: ({ name, _id }) => ({ text: name, value: _id }),
  company: ({ hierarchy, _id }) => ({ text: hierarchy, value: _id }),
  currency: ({ _id, isoCode, exchangeRate }) => ({ text: isoCode, value: { _id, isoCode, exchangeRate } }),
  sourceEntity: ({ no, _id }) => ({ text: no, value: _id }),
};
const ENTITY_TYPES = [INVOICES_ENTITY_TYPE, ADVANCE_ENTITY_TYPE, CREDIT_MEMO_ENTITY_TYPE, DEBIT_MEMO_ENTITY_TYPE];
const defineEntityType = (entity) => {
  if (entity.no.match(/IA[0-9]{6}/)) {
    return entity.type === 'Credit Memo' ? CREDIT_MEMO_ENTITY_TYPE : DEBIT_MEMO_ENTITY_TYPE;
  }
  if (entity.no.match(/AA[0-9]{6}/)) {
    return ADVANCE_ENTITY_TYPE;
  }
  if (entity.no.match(/I[0-9]{6}/)) {
    return INVOICES_ENTITY_TYPE;
  }
};
const isAdjustment = (entityNo) => /IA\d{6}-/g.test(entityNo);
const isInvoice = (entityNo) => /I\d{6}-/g.test(entityNo);
const isAdvance = (entityNo) => /AA\d{6}-/g.test(entityNo);

export default {
  PAYMENT,
  CREDIT_MEMO,
  ADVANCE,
  DEBIT_MEMO,
  INVOICE,
  SOURCE_OPTIONS,
  TARGET_OPTIONS,
  formatters,
  BANK_ACCOUNT,
  UNDEPOSITED,
  CREDIT_MEMO_ENTITY_TYPE,
  DEBIT_MEMO_ENTITY_TYPE,
  ADVANCE_ENTITY_TYPE,
  INVOICES_ENTITY_TYPE,
  defineEntityType,
  ENTITY_TYPES,
  isAdjustment,
  isInvoice,
  isAdvance,
};
