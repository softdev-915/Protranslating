import _ from 'lodash';

const _validateGrossProfit = (billingInformation, errors) => {
  if (billingInformation && billingInformation.grossProfit) {
    if (!Number.isInteger(billingInformation.grossProfit)) {
      errors.push({ message: 'Gross profit must be an integer number', props: { name: { val: billingInformation.grossProfit } } });
    }
  }
  return errors;
};

const _validateAccountOnHoldReason = (billingInformation, errors) => {
  if (billingInformation.onHold && _.isEmpty(billingInformation.onHoldReason)) {
    errors.push({ message: 'Account reason input must have a value', props: { name: { val: billingInformation.onHoldReason } } });
  }
  return errors;
};

export const findBillingInformationValidationError = function (billingInformation) {
  const errors = [];
  _validateGrossProfit(billingInformation, errors);
  _validateAccountOnHoldReason(billingInformation, errors);
  return errors;
};
