const _validateName = (currency, errors) => {
  if (currency && currency.name === '') {
    errors.push({ message: 'Currency name is empty', props: { name: { val: currency.name } } });
  }
  return errors;
};

const _validateIsoCode = (currency, errors) => {
  if (currency && currency.isoCode === '') {
    errors.push({ message: 'Currency ISO code is empty', props: { isoCode: { val: currency.isoCode } } });
  }
  return errors;
};

export const findCurrencyValidationError = function (currency) {
  const errors = [];
  _validateName(currency, errors);
  _validateIsoCode(currency, errors);
  return errors;
};
