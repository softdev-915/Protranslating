const _validateName = (paymentMethod, errors) => {
  if (paymentMethod && !paymentMethod.name) {
    errors.push({ message: 'Payment\'s form name is empty', props: { name: { val: paymentMethod.name } } });
  }
  return errors;
};

export const findPaymentMethodValidationError = function (paymentMethod) {
  const errors = [];
  _validateName(paymentMethod, errors);
  return errors;
};
