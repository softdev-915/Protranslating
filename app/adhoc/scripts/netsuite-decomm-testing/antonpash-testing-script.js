/* global print, assert, db */
/**
 * Mongo Script

Usage:

$ mongo
> use lms
> load('antonpash-testing-script.js') // or copy and paste on terminal
true
> nsDecomissionChecks()

*/

// eslint-disable-next-line no-unused-vars
const nsDecomissionChecks = function () {
  const lspList = db.lsp.find({}, { _id: 1, name: 1 }).toArray();
  const docPTS = lspList.find(doc => doc.name === 'Protranslating');
  const docPTI = lspList.find(doc => doc.name === 'PTI');
  const docBigIp = lspList.find(doc => doc.name === 'Big IP');
  const PTS_ID = docPTS._id;
  const PTI_ID = docPTI._id;
  const BIG_IP_ID = docBigIp._id;

  // 20210121095727
  print('20210121095727: Assert new roles are created');
  const internalDocumentRoles = [
    'INTERNAL-DOCUMENT_UPDATE_ALL',
    'INTERNAL-DOCUMENT_READ_ALL',
    'INTERNAL-DOCUMENT_CREATE_ALL',
    'INTERNAL-DOCUMENT_DELETE_ALL',
  ];
  let count = db.roles.find({ name: { $in: internalDocumentRoles } }).count();
  let ptiCount = db.groups.find({ lspId: PTI_ID, name: 'LSP_ADMIN', roles: { $in: internalDocumentRoles } }).count();
  let ptsCount = db.groups.find({ lspId: PTS_ID, name: 'LSP_ADMIN', roles: { $in: internalDocumentRoles } }).count();
  let bigIpCount = db.groups.find({ lspId: BIG_IP_ID, name: 'LSP_ADMIN', roles: { $in: internalDocumentRoles } }).count();
  assert(count === 4, 'Internal document roles were not created correctly');
  assert(ptiCount === 1, 'Internal document roles were not created correctly for PTI');
  assert(ptsCount === 1, 'Internal document roles were not created correctly for PTS');
  assert(bigIpCount === 1, 'Internal document roles were not created correctly for Big IP');

  // 20210119152909
  print('20210119152909: Assert old roles were removed and new roles are created');
  const accountRoles = [
    'ACCOUNT_READ_ALL',
    'ACCOUNT_CREATE_ALL',
    'ACCOUNT_UPDATE_ALL',
  ];
  count = db.roles.find({ name: { $in: accountRoles } }).count();
  ptiCount = db.groups.find({ lspId: PTI_ID, name: 'LSP_ADMIN', roles: { $in: accountRoles } }).count();
  ptsCount = db.groups.find({ lspId: PTS_ID, name: 'LSP_ADMIN', roles: { $in: accountRoles } }).count();
  bigIpCount = db.groups.find({ lspId: BIG_IP_ID, name: 'LSP_ADMIN', roles: { $in: accountRoles } }).count();
  assert(count === 0, 'Account roles were not removed correctly');
  assert(ptiCount === 0, 'Account roles roles were not removed correctly for PTI');
  assert(ptsCount === 0, 'Account roles roles were not removed correctly for PTS');
  assert(bigIpCount === 0, 'Account roles roles were not removed correctly for Big IP');
  const revenueAccountRoles = [
    'REVENUE-ACCOUNT_READ_ALL',
    'REVENUE-ACCOUNT_CREATE_ALL',
    'REVENUE-ACCOUNT_UPDATE_ALL',
  ];
  count = db.roles.find({ name: { $in: revenueAccountRoles } }).count();
  ptiCount = db.groups.find({ lspId: PTI_ID, name: 'LSP_ADMIN', roles: { $in: revenueAccountRoles } }).count();
  ptsCount = db.groups.find({ lspId: PTS_ID, name: 'LSP_ADMIN', roles: { $in: revenueAccountRoles } }).count();
  bigIpCount = db.groups.find({ lspId: BIG_IP_ID, name: 'LSP_ADMIN', roles: { $in: revenueAccountRoles } }).count();
  assert(count === 3, 'Revenue account roles were not created correctly');
  assert(ptiCount === 1, 'Revenue account roles roles were not created correctly for PTI');
  assert(ptsCount === 1, 'Revenue account roles roles were not created correctly for PTS');
  assert(bigIpCount === 1, 'Revenue account roles roles were not created correctly for Big IP');

  // 20201230114356
  print('20201230114356: Assert "company" index was removed from "templates" collection');
  const templatesIndexes = db.templates.getIndexes();
  const templatesCompanyIndex = templatesIndexes.find(index => index.name === 'company_1');
  assert(!templatesCompanyIndex, 'Company index was not removed from templates collection');
};
