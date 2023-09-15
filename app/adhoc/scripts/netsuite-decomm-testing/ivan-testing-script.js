/* global print, assert, db */
/**
 * Mongo Script

Usage:

$ mongo
> use lms
> load('ivan-testing-script.js') // or copy and paste on terminal
true
> nsDecomissionChecks()

*/

// eslint-disable-next-line no-unused-vars
const nsDecomissionChecks = function () {
  let ptiCounter;
  let ptsCounter;
  const lspList = db.lsp.find({}, { _id: 1, name: 1 }).toArray();
  const docPTS = lspList.find(doc => doc.name === 'Protranslating');
  const docPTI = lspList.find(doc => doc.name === 'PTI');
  const docBigIP = lspList.find(doc => doc.name === 'Big IP');
  const PTS_ID = docPTS._id;
  const PTI_ID = docPTI._id;
  const BIG_IP_ID = docBigIP._id;
  // 20201119015811
  const newRoles = ['LSP-SETTINGS-ACCT_UPDATE_OWN'];
  print('20201119015811: Confirming new roles');
  const counter = db.roles.find({ name: { $in: newRoles } }).count(); // should be 1
  assert(counter === 1, `Missing new roles ${newRoles}`);
  ptiCounter = db.groups.find({ lspId: PTI_ID, name: 'LSP_ADMIN', roles: { $in: newRoles } }).count(); // Should be 1
  ptsCounter = db.groups.find({ lspId: PTS_ID, name: 'LSP_ADMIN', roles: { $in: newRoles } }).count(); // Should be 1
  assert(ptiCounter === 1, 'LSP_ADMIN roles missing for PTI');
  assert(ptsCounter === 1, 'LSP_ADMIN roles missing for PTS');
  // 20210213022950
  print('20210213022950: Confirming Sage Intacct connector');
  ptiCounter = db.connectors.find({ lspId: PTI_ID, name: 'Sage Intacct' }).count();
  ptsCounter = db.connectors.find({ lspId: PTS_ID, name: 'Sage Intacct' }).count();
  const bigIpCounter = db.connectors.find({ lspId: BIG_IP_ID, name: 'Sage Intacct' }).count();
  assert(ptiCounter === 1, 'Sage Intacct connector missing for PTI');
  assert(ptsCounter === 1, 'Sage Intacct connector missing for PTS');
  assert(bigIpCounter === 1, 'Sage Intacct connector missing for PTS');
};
