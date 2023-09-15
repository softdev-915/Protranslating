const _ = require('lodash');
const xmlEscape = require('xml-escape');

const PAYLOADS = {
  exist: 'apBillList',
  create: 'apBillCreate',
  update: 'apBillUpdate',
};
const generateBillItemsTag = (bill) => {
  const billingInformation = _.get(bill, 'vendor.vendorDetails.billingInformation', {});
  return bill.serviceDetails.map((item) => {
    const { form1099Box = '', form1099Type } = billingInformation;
    const form1099 = !_.isEmpty(form1099Box);
    return `<APBILLITEM>
    <ACCOUNTNO>${item.expenseAccountNo}</ACCOUNTNO>
    <TRX_AMOUNT>${item.taskAmount}</TRX_AMOUNT>
    <ENTRYDESCRIPTION>${xmlEscape(item.taskDescription)}</ENTRYDESCRIPTION>
    <DEPARTMENTID>${xmlEscape(item.accountingDepartmentId)}</DEPARTMENTID>
    <FORM1099>${form1099}</FORM1099>
    <FORM1099TYPE>${form1099Type}</FORM1099TYPE>
    <FORM1099BOX>${form1099Box.charAt(0)}</FORM1099BOX>
    </APBILLITEM>`;
  }).join('');
};

const generateExtraPayloadFieldsApBill = (bill, extra) => {
  const billingInformation = _.get(bill, 'vendor.vendorDetails.billingInformation', {});
  const { billsOnHold, priorityPayment, billingTerms = {} } = billingInformation;
  return {
    ...bill,
    ...extra,
    termName: _.get(bill, 'billingTerms.name', billingTerms.name),
    paymentPriority: _.get(bill, 'priorityPayment', priorityPayment) ? 'urgent' : 'normal',
    onHold: _.get(bill, 'billOnHold', billsOnHold),
    billItems: `${generateBillItemsTag(bill)}`,
  };
};

module.exports = {
  payloadsApBill: PAYLOADS,
  generateExtraPayloadFieldsApBill,
};
