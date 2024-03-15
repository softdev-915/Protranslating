const _validateName = (translationUnit, errors) => {
  if (translationUnit && !translationUnit.name) {
    errors.push({ message: 'Billing Unit name is empty', props: { name: { val: translationUnit.name } } });
  }
  return errors;
};

export const findTranslationUnitValidationError = function (translationUnit) {
  const errors = [];
  _validateName(translationUnit, errors);
  return errors;
};
