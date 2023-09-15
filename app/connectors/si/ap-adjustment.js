const _ = require('lodash');
const xmlEscape = require('xml-escape');

const CREDIT_TYPE = 'Credit Memo';
const PAYLOADS = {
  exist: 'apAdjustmentList',
  create: 'apAdjustmentCreate',
};

const generateLineItemsTag = (apAdjustment, amountMultiplier = 1) => {
  const apAdjustmentLineItems = _.defaultTo(apAdjustment.lineItems, []);
  const bill = _.get(apAdjustment, 'bill');
  return apAdjustmentLineItems.map((entry) => {
    const accountingDepartmentId = _.get(entry, 'departmentId.accountingDepartmentId', '');
    const has1099EligibleForm = _.get(bill, 'has1099EligibleForm', false);
    if (_.isNil(accountingDepartmentId)) {
      throw new Error('Accounting department id should not be empty');
    }
    const glAccountNumber = _.get(entry, 'glAccountNo.number', '');
    if (_.isNil(glAccountNumber)) {
      throw new Error('GL Account Number should not be empty');
    }
    return `<lineitem>
      <glaccountno>${glAccountNumber}</glaccountno>
      <amount>${entry.amount * amountMultiplier}</amount>
      <memo>${xmlEscape(entry.memo)}</memo>
      <departmentid>${xmlEscape(accountingDepartmentId)}</departmentid>
      <item1099>${has1099EligibleForm}</item1099>
      </lineitem>`;
  }).join('');
};

const generateExtraPayloadFieldsApAdjustment = (apAdjustment, extra) => {
  const amountMultiplier = apAdjustment.type === CREDIT_TYPE ? 1 : -1;
  return {
    ...apAdjustment,
    ...extra,
    apAdjustmentItems: generateLineItemsTag(apAdjustment, amountMultiplier),
  };
};

module.exports = {
  payloadsApAdjustment: PAYLOADS,
  generateExtraPayloadFieldsApAdjustment,
};
