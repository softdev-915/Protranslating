/* global print, assert, db */
/**
 * Mongo Script

Usage:

$ mongo
> load('ham-testing-script.js') // or copy and paste on terminal
true
> nsDecomissionChecks()

*/

// eslint-disable-next-line no-unused-vars
const nsDecomissionChecks = function () {
  let counter;
  const lspList = db.lsp.find({}, { _id: 1, name: 1 }).toArray();
  const docPTS = lspList.find(doc => doc.name === 'Protranslating');
  const PTS_ID = docPTS._id;

  // 20210422144306
  print('20210422144306: Confirming tomorrow date for vendorPaymentPeriodStartDate is set');
  counter = db.lsp.find({
    $and: [
      { vendorPaymentPeriodStartDate: { $exists: true } },
      { vendorPaymentPeriodStartDate: { $ne: null } },
    ],
  }).count();
  assert(counter >= 1, 'There should be lsps with tomorrow vendorPaymentPeriodStartDate');

  // 20201119015811
  print('20201119015811: Confirming LSP-SETTINGS-ACCT_UPDATE_OWN added in group LSP_ADMIN');
  counter = db.groups.find({ name: 'LSP_ADMIN', roles: 'LSP-SETTINGS-ACCT_UPDATE_OWN' }).count(); // Should be greater than 1
  assert(counter >= 1, 'There should be LSP-SETTINGS-ACCT_UPDATE_OWN in the group LSP_ADMIN');

  // 20201015112159
  print('20201015112159: Confirming sourceDocumentsList is migrated');
  const languageCombinationsCounter = db.requests.find({ 'languageCombinations.0': { $exists: true } }).count();
  const sourceDocumentsListCounter = db.requests.find({ sourceDocumentsList: { $exists: true } })
    .count();
  assert(languageCombinationsCounter === sourceDocumentsListCounter, 'Failed to update source documents list');

  // 20201027170224
  print('20201027170224: Confirming Quote Template PTS_LMS-95_01 is updated.');
  counter = db.templates.find({
    name: 'Quote Template PTS_LMS-95_01',
    lspId: PTS_ID,
  }).count();
  assert(counter >= 1, 'Quote Template PTS_LMS-95_01 template is not updated');
};

