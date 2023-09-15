const { generateLineItemsTag } = require('./common');

const CREDIT_TYPE = 'Credit Memo';
const PAYLOADS = {
  exist: 'arAdjustmentList',
  create: 'arAdjustmentCreate',
};

const generateExtraPayloadFieldsArAdjustment = (adjustment) => {
  const amountMultiplier = adjustment.type === CREDIT_TYPE ? -1 : 1;
  const entries = adjustment.invoiceEntries.concat(adjustment.ownEntries);

  return {
    ...adjustment,
    adjustmentItems: generateLineItemsTag(entries, amountMultiplier),
  };
};

module.exports = {
  payloadsArAdjustment: PAYLOADS,
  generateExtraPayloadFieldsArAdjustment,
};
