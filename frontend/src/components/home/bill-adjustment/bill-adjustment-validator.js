import _ from 'lodash';

const _validateBillAdjustment = (billAdjustment, errors) => {
  if (_.isEmpty(billAdjustment.type)) {
    errors.push({ message: 'Adjustment type is mandatory', props: { 'billAdjustment.type': { val: billAdjustment.type } } });
  }
  if (_.isEmpty(billAdjustment.vendor)) {
    errors.push({ message: 'Vendor is mandatory', props: { 'billAdjustment.vendor': { val: billAdjustment.vendor } } });
  }
  if (!billAdjustment.date) {
    errors.push({ message: 'Adjustment Date is mandatory', props: { 'billAdjustment.date': { val: billAdjustment.date } } });
  }
  if (!billAdjustment.glPostingDate) {
    errors.push({ message: 'GL Posting Date is mandatory', props: { 'billAdjustment.glPostingDate': { val: billAdjustment.glPostingDate } } });
  }
};

export const findBillAdjustmentValidationError = function (billAdjustment) {
  const errors = [];
  _validateBillAdjustment(billAdjustment, errors);
  return errors;
};
