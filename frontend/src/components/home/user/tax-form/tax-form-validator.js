export const findTaxFormValidationError = function (taxForm) {
  const errors = [];
  if (taxForm && !taxForm.name) {
    errors.push({ message: 'Tax form name is empty', props: { name: { val: taxForm.name } } });
  }
  return errors;
};
