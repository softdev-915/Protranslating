const _ = require('lodash');
const { isAdjustment, isInvoice, isAdvance } = require('../../endpoints/lsp/ar-payment/ar-payment-api-helpers');

const PAYLOADS = {
  exist: 'arPaymentList',
  create: 'arPaymentCreate',
  void: 'paymentReverse',
};
const generateArPaymentDetailsTag = (arPayment, siEntitiesLookupDict) => {
  const { source, target } = arPayment;
  if (_.isEmpty(source)) {
    const arPaymentDetailsDebitWithPaymentMethodTags = target
      .filter(t => isAdjustment(t.no))
      .map(({ no, amount }) =>
        `<arpymtdetail><posadjkey>${siEntitiesLookupDict[no]}</posadjkey><trx_paymentamount>${amount}</trx_paymentamount></arpymtdetail>`);
    const arPaymentDetailsInvoiceWithPaymentMethodTags = target
      .filter(t => isInvoice(t.no))
      .map(({ no, amount }) =>
        `<arpymtdetail><recordkey>${siEntitiesLookupDict[no]}</recordkey><trx_paymentamount>${amount}</trx_paymentamount></arpymtdetail>`);
    return [
      ...arPaymentDetailsDebitWithPaymentMethodTags,
      ...arPaymentDetailsInvoiceWithPaymentMethodTags,
    ].join('');
  }
  if (isAdvance(source)) {
    const arPaymentDetailsDebitWithAdvanceTags = target
      .filter(t => isAdjustment(t.no))
      .map(({ no, amount }) =>
        `<arpymtdetail><posadjkey>${siEntitiesLookupDict[no]}</posadjkey><advancekey>${siEntitiesLookupDict[source]}</advancekey><trx_postedadvanceamount>${amount}</trx_postedadvanceamount></arpymtdetail>`);
    const arPaymentDetailsInvoiceWithAdvanceTags = target
      .filter(t => isInvoice(t.no))
      .map(({ no, amount }) =>
        `<arpymtdetail><recordkey>${siEntitiesLookupDict[no]}</recordkey><advancekey>${siEntitiesLookupDict[source]}</advancekey><trx_postedadvanceamount>${amount}</trx_postedadvanceamount></arpymtdetail>`);
    return [
      ...arPaymentDetailsDebitWithAdvanceTags,
      ...arPaymentDetailsInvoiceWithAdvanceTags,
    ].join('');
  }
  if (isAdjustment(source)) {
    const arPaymentDetailsDebitWithCreditTags = target
      .filter(t => isAdjustment(t.no))
      .map(({ no, amount }) =>
        `<arpymtdetail><posadjkey>${siEntitiesLookupDict[no]}</posadjkey><adjustmentkey>${siEntitiesLookupDict[source]}</adjustmentkey><trx_adjustmentamount>${amount}</trx_adjustmentamount></arpymtdetail>`);
    const arPaymentDetailsInvoiceWithCreditTags = target
      .filter(t => isInvoice(t.no))
      .map(({ no, amount }) =>
        `<arpymtdetail><recordkey>${siEntitiesLookupDict[no]}</recordkey><adjustmentkey>${siEntitiesLookupDict[source]}</adjustmentkey><trx_adjustmentamount>${amount}</trx_adjustmentamount></arpymtdetail>`);
    return [
      ...arPaymentDetailsDebitWithCreditTags,
      ...arPaymentDetailsInvoiceWithCreditTags,
    ].join('');
  }
};

const generateExtraPayloadFields = (arPayment, siEntitiesLookupDict) => ({
  ...arPayment,
  apPaymentDetails: generateArPaymentDetailsTag(arPayment, siEntitiesLookupDict),
});

module.exports = {
  payloadsArPayment: PAYLOADS,
  generateExtraPayloadFieldsArPayment: generateExtraPayloadFields,
};
