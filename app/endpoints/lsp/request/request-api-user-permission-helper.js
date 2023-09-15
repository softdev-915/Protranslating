const CONTACT_USER_TYPE = 'Contact';
const CONTACT_NOT_ALLOWED_FIELDS = [
  'bucketPrefixes',
  'expectedStartDate',
  'actualStartDate',
  'actualDeliveryDate',
  'internalDepartment',
  'partners',
  'insuranceCompany',
  'recipient',
  'rooms',
  'atendees',
  'expectedDurationTime',
  'schedulingContact',
  'requestType',
  'schedulingStatus',
  'catTool',
  'opportunityNo',
  'internalComments',
  'location',
];

const cleanToAssignObject = (toAssign, userType) => {
  if (userType === CONTACT_USER_TYPE) {
    CONTACT_NOT_ALLOWED_FIELDS.forEach(f => delete toAssign[f]);
  }
};

module.exports = {
  cleanToAssignObject,
};
