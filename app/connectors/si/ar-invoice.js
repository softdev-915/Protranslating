const xmlEscape = require('xml-escape');
const moment = require('moment');

const PAYLOADS = {
  exist: 'arInvoiceList',
  create: 'arInvoiceCreate',
  update: 'arInvoiceUpdate',
  void: 'arInvoiceReverse',
};

/** @todo replace with same function from ./common.js */
const generateInvoiceCreateItemsTag = (invoice) => invoice.entries.map((entry) => `<lineitem>
    <glaccountno>${entry.ability.glAccountNo}</glaccountno>
    <amount>${entry.amount}</amount>
    <memo>${xmlEscape(entry.memo)}</memo>
    <departmentid>${xmlEscape(entry.internalDepartment.accountingDepartmentId)}</departmentid>
    <revrecstartdate>
      <year>${moment.utc(invoice.revenueRecognition.startDate).format('YYYY')}</year>
      <month>${moment.utc(invoice.revenueRecognition.startDate).format('MM')}</month>
      <day>${moment.utc(invoice.revenueRecognition.startDate).format('DD')}</day>
    </revrecstartdate>
    <revrecenddate>
      <year>${moment.utc(invoice.revenueRecognition.endDate).format('YYYY')}</year>
      <month>${moment.utc(invoice.revenueRecognition.endDate).format('MM')}</month>
      <day>${moment.utc(invoice.revenueRecognition.endDate).format('DD')}</day>
    </revrecenddate>
  </lineitem>`).join('');
const generateInvoiceUpdateItemsTag = (invoice) => invoice.entries.map((entry, index) => `<updatelineitem line_num="${index + 1}"><memo>${xmlEscape(entry.memo)}</memo></updatelineitem>`).join('');
const generateExtraPayloadFieldsArInvoice = (invoice) => ({
  ...invoice,
  invoiceCreateItems: generateInvoiceCreateItemsTag(invoice),
  invoiceUpdateItems: generateInvoiceUpdateItemsTag(invoice),
});

module.exports = {
  payloadsArInvoice: PAYLOADS,
  generateExtraPayloadFieldsArInvoice,
};
