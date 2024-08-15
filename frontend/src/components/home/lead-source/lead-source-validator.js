const _validateName = (leadSource, errors) => {
  if (leadSource && !leadSource.name) {
    errors.push({ message: 'Lead\'s source name is empty', props: { name: { val: leadSource.name } } });
  }
  return errors;
};

export const findLeadSourceValidationError = function (leadSource) {
  const errors = [];
  _validateName(leadSource, errors);
  return errors;
};
