export const findSoftwareRequirementValidationError = function (softwareRequirement) {
  const errors = [];
  if (softwareRequirement && !softwareRequirement.name) {
    errors.push({ message: 'Software requirement name is empty', props: { name: { val: softwareRequirement.name } } });
  }
  return errors;
};
