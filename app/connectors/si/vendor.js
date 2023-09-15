const _ = require('lodash');

const FORM_1099_ELIGIBLE_NAME = '1099 Eligible';
const FORM_1099_BOX_OPTIONS_MAP = {
  '1 - Rents': 1,
  '2 - Royalties': 2,
  '3 - Other Income': 3,
};
const PAYLOADS = {
  exist: 'vendorList',
  create: 'vendorCreate',
  update: 'vendorUpdate',
};

const getForm1099Fields = (billingInformation) => {
  const taxForms = _.get(billingInformation, 'taxForm', []);
  const has1099EligibleTaxForm = !_.isNil(taxForms.find(tf => tf.name === FORM_1099_ELIGIBLE_NAME));
  let { form1099Box, form1099Type } = billingInformation;
  if (has1099EligibleTaxForm) {
    if (!Object.keys(FORM_1099_BOX_OPTIONS_MAP).includes(form1099Box)) {
      throw new Error(`Form 1099 box value ${form1099Box} is invalid. Should be one of ${Object.keys(FORM_1099_BOX_OPTIONS_MAP)}`);
    }
    form1099Box = FORM_1099_BOX_OPTIONS_MAP[form1099Box];
  } else {
    form1099Type = '';
    form1099Box = '';
  }
  return { form1099Box, form1099Type };
};

const generateExtraPayloadFieldsVendor = (vendor) => {
  const billingInformation = _.get(vendor, 'vendorDetails.billingInformation', {});
  const form1099Fields = getForm1099Fields(billingInformation);
  const vendorFullName = `${vendor.firstName} ${vendor.middleName} ${vendor.lastName}`;
  let name1099 = '';
  if (!_.isEmpty(form1099Fields.form1099Type)) name1099 = _.get(vendor, 'vendorDetails.vendorCompany') || vendorFullName;
  return {
    ...vendor,
    ...form1099Fields,
    name1099,
  };
};

module.exports = {
  payloadsVendor: PAYLOADS,
  generateExtraPayloadFieldsVendor,
};
