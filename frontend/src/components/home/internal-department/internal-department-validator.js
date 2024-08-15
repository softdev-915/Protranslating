import _ from 'lodash';

const _validateName = (internalDepartment, errors) => {
  if (internalDepartment && !internalDepartment.name) {
    errors.push({ message: 'Internal department name is empty', props: { name: { val: internalDepartment.name } } });
  }
  return errors;
};
const _validateAccountingDepartmentId = (internalDepartment, errors) => {
  if (_.isEmpty(_.get(internalDepartment, 'accountingDepartmentId', ''))) {
    errors.push({
      message: 'Internal department accounting department id is empty',
      props: {
        accountingDepartmentId: {
          val: internalDepartment.accountingDepartmentId,
        },
      },
    });
  }
  return errors;
};

export const findInternalDepartmentValidationError = function (internalDepartment) {
  const errors = [];
  _validateName(internalDepartment, errors);
  _validateAccountingDepartmentId(internalDepartment, errors);
  return errors;
};
