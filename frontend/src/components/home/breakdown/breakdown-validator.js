const _validateName = (breakdown, errors) => {
  if (breakdown && !breakdown.name) {
    errors.push({ message: 'Breakdown name is empty', props: { name: { val: breakdown.name } } });
  }
  return errors;
};

export const findBreakdownValidationError = function (breakdown) {
  const errors = [];
  _validateName(breakdown, errors);
  return errors;
};
