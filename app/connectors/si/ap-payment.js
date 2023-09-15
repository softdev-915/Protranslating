const _ = require('lodash');
const logger = require('../../components/log/logger');
const mongooseSchema = require('../../components/database/mongo').models;
const ProviderEmailQueue = require('../../components/email/provider-email-queue');

const SCHEDULER_NAME = 'bill-paid-provider';
const PAYLOADS = {
  exist: 'apPaymentList',
  create: 'apPaymentCreate',
  void: 'paymentReverse',
};
const BILL_ENTITTY_NAME = 'bill';
const AP_ADJUSTMENT_ENTITY_NAME = 'billAdjustment';
const generateApPaymentDetailsTag = (entries, siEntitiesLookupDict) => {
  const apPaymentDetailsBillWithPaymentMethodsTags = entries
    .filter((entry) => entry.appliedToType === BILL_ENTITTY_NAME && entry.paymentAmount > 0)
    .map((entry) => `<appymtdetail><recordkey>${siEntitiesLookupDict[entry.appliedToNo]}</recordkey><trx_paymentamount>${entry.paymentAmount}</trx_paymentamount></appymtdetail>`);
  const apPaymentDetailsBillWithDebitTags = entries
    .filter((entry) => entry.appliedToType === BILL_ENTITTY_NAME && entry.appliedCredits > 0)
    .map((entry) => `<appymtdetail><recordkey>${siEntitiesLookupDict[entry.appliedToNo]}</recordkey><adjustmentkey>${siEntitiesLookupDict[entry.appliedFromNo]}</adjustmentkey><trx_adjustmentamount>${entry.appliedCredits}</trx_adjustmentamount></appymtdetail>`);
  const apPaymentDetailsCreditWithDebitTags = entries
    .filter((entry) => entry.appliedToType === AP_ADJUSTMENT_ENTITY_NAME && entry.appliedCredits > 0)
    .map((entry) => `<appymtdetail><posadjkey>${siEntitiesLookupDict[entry.appliedToNo]}</posadjkey><adjustmentkey>${siEntitiesLookupDict[entry.appliedFromNo]}</adjustmentkey><trx_adjustmentamount>${entry.appliedCredits}</trx_adjustmentamount></appymtdetail>`);
  const apPaymentDetailsCreditWithPaymentMethodTags = entries
    .filter((entry) => entry.appliedToType === AP_ADJUSTMENT_ENTITY_NAME && entry.paymentAmount > 0)
    .map((entry) => `<appymtdetail><posadjkey>${siEntitiesLookupDict[entry.appliedToNo]}</posadjkey><trx_paymentamount>${entry.paymentAmount}</trx_paymentamount></appymtdetail>`);
  return [
    ...apPaymentDetailsBillWithPaymentMethodsTags,
    ...apPaymentDetailsBillWithDebitTags,
    ...apPaymentDetailsCreditWithDebitTags,
    ...apPaymentDetailsCreditWithPaymentMethodTags,
  ].join('');
};

const generateExtraPayloadFieldsApPayment = (apPayment, siEntitiesLookupDict) => ({
  ...apPayment,
  apPaymentDetailsTag: generateApPaymentDetailsTag(apPayment.details, siEntitiesLookupDict),
});

const sendVendorNotifications = async (apPayment) => {
  if (_.isNil(apPayment)) {
    throw new Error('Payment was not found');
  }
  const { lspId } = apPayment;
  const apPaymentDetails = _.get(apPayment, 'details', []);
  const emailQueue = new ProviderEmailQueue(logger, mongooseSchema);
  const lsp = await mongooseSchema.LspSecondary.findById(apPayment.lspId).select('name url').lean();
  const vendorInDb = await mongooseSchema.User
    .findById(apPayment.vendor)
    .select('firstName lastName email secondaryEmail inactiveSecondaryEmailNotifications')
    .lean();
  const billDetails = apPaymentDetails.map(({ appliedToNo, paymentAmount }) => ({
    no: appliedToNo,
    amountPaid: Number(paymentAmount),
    amountPaidFormatted: Number(paymentAmount).toFixed(2),
  }));
  return emailQueue.send({
    templateName: SCHEDULER_NAME,
    context: {
      lsp,
      billDetails,
      user: vendorInDb,
      path: lsp.url,
      totalAmountPaid: billDetails.reduce((total, item) => total + item.amountPaid, 0),
      apPaymentId: apPayment._id.toString(),
    },
    lspId,
  });
};

module.exports = {
  payloadsApPayment: PAYLOADS,
  sendVendorNotifications,
  generateExtraPayloadFieldsApPayment,
};
