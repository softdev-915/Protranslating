const xmlEscape = require('xml-escape');

const generateLineItemsTag = (entries, amountMultiplier = 1) => entries
  .map((entry) => `<lineitem><glaccountno>${entry.glAccountNo}</glaccountno><amount>${entry.amount * amountMultiplier}</amount><memo>${xmlEscape(entry.memo)}</memo><departmentid>${xmlEscape(entry.departmentId)}</departmentid></lineitem>`)
  .join('');

module.exports = {
  generateLineItemsTag,
};
