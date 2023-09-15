/**
 * Mongo Script

Usage:

$ mongo
> load('lms-checks.js') // or copy and paste on terminal
true
> lmsChecks()

*/

lmsChecks = function () {
  lspList = db.lsp.find({}, { _id: 1, name: 1 }).toArray();
  print('Get protranslating lspId');
  assert(lspList.length === 2, 'Should be 2 lspIds');

  docPTS = lspList.find(doc => doc.name === 'Protranslating');
  docPTI = lspList.find(doc => doc.name === 'PTI');
  PTS_ID = docPTS._id;
  PTI_ID = docPTI._id;

  print(' Confirming all users were migrated to the new structure');
  counter = db.users.find({ lsp: { $exists: false }, 'accounts.lsp': { $exists: true } }).count(); // Should be 0
  assert(counter === 0, 'Users without lsp count should be 0');

  print(' Confirming users have lsp ');
  counter = db.users.find({ lsp: { $exists: true } }).count(); // Should be > 0
  assert(counter > 0, 'Should be > 0');

  print(' Confirming users grops have lspId ');
  counter = db.users.find({ groups: { $exists: true }, groups: { $ne: [] }, 'groups.lspId': { $exists: false }, lsp: { $exists: true } }).count(); // Should be > 0
  assert(counter === 0, 'Should be > 0');

  print(' Confirming accounts array is gone');
  accountsList = db.users.find({ 'accounts.lsp': { $exists: true } }).toArray(); // Should be null or empty
  assert(accountsList.length === 0, 'Account List should be null or empty'); // Should be null or empty

  print(' Confirming if users who were deleted are now inactive or not inactive (new flag is inactive and not deleted)');

  // TODO: why might?
  deletedUsers = db.users.find({ deleted: true }).count(); // Might be > 0 if there's at least one deleted user
  assert(deletedUsers >= 0, 'Deleted users should be > 0');

  inactiveUsers = db.users.find({ inactive: { $exists: true } }).count(); // Inactive flag should not exist
  assert(inactiveUsers === 0, 'Inactive users should be 0');

  print(' Confirming karze@protranslating.com user was removed from Protranslating LSP_ADMIN group');
  particularUser = db.users.find({ email: 'karze@protranslating.com', 'groups.lspId': PTS_ID }).count(); // Should be 2
  assert(particularUser === 0, 'Karze@protranslating.com user still has Protranslating LSP_ADMIN');

  print(' Confirming ptzankova@protranslating.com user was migrated');
  particularUser = db.users.find({ email: 'ptzankova@protranslating.com' }).count(); // Should be 2
  assert(particularUser === 2, 'ptzankova@protranslating.com user was not migrated to PTI');

  print(' Confirming all collections have the same amount of records for both LSP');

  counter = db.groups.find({ lspId: { $exists: false } }).count(); // Should be 0
  assert(counter === 0, 'Amount of groups without lspId should be 0');
  countGroups_PTS = db.groups.find({ lspId: PTS_ID }).count(); // Count for PTS
  countGroups_PTI = db.groups.find({ lspId: PTI_ID }).count(); // Count for PTS
  assert(countGroups_PTS >= 20, 'Number of groups for PTS should be greater than 20');
  assert(countGroups_PTI >= 20, 'Number of groups for PTI should be greater than 20');

  counter = db.abilities.find({ lspId: { $exists: false } }).count(); // Should be 0
  assert(counter === 0, 'Should be 0');
  countAbilities_PTS = db.abilities.find({ lspId: PTS_ID }).count(); // Count for PTS
  countAbilities_PTI = db.abilities.find({ lspId: PTI_ID }).count(); // should be equal to the above
  assert(countAbilities_PTS >= 20, 'Number of PTS abilities should be greater than 20');
  assert(countAbilities_PTI >= 20, 'Number of PTI abilities should be greater than 20');

  counter = db.leadSources.find({ lspId: { $exists: false } }).count(); // Should be 0
  assert(counter === 0, 'Number of lead sources without lspId should be 0');
  countLeadSources_PTS = db.leadSources.find({ lspId: PTS_ID }).count(); // Count for PTS
  countLeadSources_PTI = db.leadSources.find({ lspId: PTI_ID }).count(); // should be equal to the above
  assert(countLeadSources_PTS >= 0, 'Number of PTS lead sources should be greater than or equal to 0');
  assert(countLeadSources_PTI >= 0, 'Number of PTI lead sources should be greater than or equal to 0');

  counter = db.currencies.find({ lspId: { $exists: false } }).count(); // Should be 0
  assert(counter === 0, 'Number of currencies without lspId should be 0');
  countCurrenciesPTS = db.currencies.find({ lspId: PTS_ID }).count(); // Count for PTS
  countCurrenciesPTI = db.currencies.find({ lspId: PTI_ID }).count(); // should be equal to the above
  assert(countCurrenciesPTS >= 20, 'Number of PTS lead sources should be greater than or equal to 20');
  assert(countCurrenciesPTI >= 20, 'Number of PTI lead sources should be greater than or equal to 20');

  counter = db.paymentMethods.find({ lspId: { $exists: false } }).count(); // Should be 0
  assert(counter === 0, 'Number of payment methods without lspId should be 0');
  countPaymentMethodsPTS = db.paymentMethods.find({ lspId: PTS_ID }).count(); // Count for PTS
  countPaymentMethodsPTI = db.paymentMethods.find({ lspId: PTI_ID }).count(); // should be equal to the above
  assert(countPaymentMethodsPTS >= 3, 'Number of PTS payment methods should be greater than or equal to 3');
  assert(countPaymentMethodsPTI >= 3, 'Number of PTI payment methods should be greater than or equal to 3');

  counter = db.billingTerms.find({ lspId: { $exists: false } }).count(); // Should be 0
  assert(counter === 0, 'Number of billing terms without lspId should be 0');
  countBillingTermsPTS = db.billingTerms.find({ lspId: PTS_ID }).count(); // Count for PTS
  countBillingTermsPTI = db.billingTerms.find({ lspId: PTI_ID }).count(); // should be equal to the above
  assert(countBillingTermsPTS >= 3, 'Number of PTS billing terms should be greater than or equal to 3');
  assert(countBillingTermsPTI >= 3, 'Number of PTI billing terms should be greater than or equal to 3');

  counter = db.breakdowns.find({ lspId: { $exists: false } }).count(); // Should be 0
  assert(counter === 0, 'Number of breakdowns without lspId should be 0');
  countBreakdownsPTS = db.breakdowns.find({ lspId: PTS_ID }).count(); // Count for PTS
  countBreakdownsPTI = db.breakdowns.find({ lspId: PTI_ID }).count(); // should be equal to the above
  assert(countBreakdownsPTS >= 3, 'Number of PTS breakdowns should be greater than or equal to 3');
  assert(countBreakdownsPTI >= 3, 'Number of PTI breakdowns should be greater than or equal to 3');

  counter = db.competenceLevels.find({ lspId: { $exists: false } }).count(); // Should be 0
  assert(counter === 0, 'Number of competence levels without lspId should be 0');
  countCompetenceLevelsPTS = db.competenceLevels.find({ lspId: PTS_ID }).count(); // Count for PTS
  countCompetenceLevelsPTI = db.competenceLevels.find({ lspId: PTI_ID }).count();
  assert(countCompetenceLevelsPTS >= 3, 'Number of PTS competenceLevels should be greater than or equal to 3');
  assert(countCompetenceLevelsPTI >= 3, 'Number of PTI competenceLevels should be greater than or equal to 3');

  counter = db.activityTags.find({ lspId: { $exists: false } }).count(); // Should be 0
  assert(counter === 0, 'Number of activity tags without lspId should be 0');
  countActivityTagsPTS = db.activityTags.find({ lspId: PTS_ID }).count(); // Count for PTS
  countActivityTagsPTI = db.activityTags.find({ lspId: PTI_ID }).count(); // should be equal to the above
  assert(countActivityTagsPTS >= 3, 'Number of PTS activityTags should be greater than or equal to 3');
  assert(countActivityTagsPTI >= 3, 'Number of PTI activityTags should be greater than or equal to 3');

  counter = db.catTool.find({ lspId: { $exists: false } }).count(); // Should be 0
  assert(counter === 0, 'Cat tools without lspId should be 0');
  countCatToolPTS = db.catTool.find({ lspId: PTS_ID }).count(); // Count for PTS
  countCatToolPTI = db.catTool.find({ lspId: PTI_ID }).count(); // should be equal to the above
  assert(countCatToolPTS >= 3, 'Number of PTS catTool should be greater than or equal to 3');
  assert(countCatToolPTI >= 3, 'Number of PTI catTool should be greater than or equal to 3');

  counter = db.translationUnits.find({ lspId: { $exists: false } }).count(); // Should be 0
  assert(counter === 0, 'Number of translation units without lspId should be 0');
  countTranslationUnitsPTS = db.translationUnits.find({ lspId: PTS_ID }).count(); // Count for PTS
  countTranslationUnitsPTI = db.translationUnits.find({ lspId: PTI_ID }).count(); // should be equal to the above
  assert(countTranslationUnitsPTS >= 3, 'Number of PTS translationUnits should be greater than or equal to 3');
  assert(countTranslationUnitsPTI >= 3, 'Number of PTI translationUnits should be greater than or equal to 3');

  counter = db.notifications.find({ lspId: { $exists: false } }).count(); // Should be 0
  assert(counter === 0, 'Notifications without lspId should be 0');
  countNotifications = db.notifications.find({ lspId: PTS_ID }).count(); // Should be > 0

  assert(countNotifications > 0, 'Notifications should be > 0');

  print(' Confirming new roles were added');

  // counter = db.roles.find({ lspId: { $exists: false }}).count(); // Should be 0
  // assert(counter === 0, 'Should be 0');
  countRoles = db.roles.find({ name: { $in: ['LSP-SETTINGS_UPDATE_OWN', 'LSP-SETTINGS_READ_OWN'] } }).count(); // Should be 2
  assert(countRoles === 2, 'LSP-SETTINGS related roles should be 2');

  // Confirm both LSP_ADMIN groups have the new roles
  countGroups = db.groups.find({ name: 'LSP_ADMIN', roles: { $elemMatch: { $eq: 'LSP-SETTINGS_UPDATE_OWN' } } }).count(); // Should be 2
  assert(countGroups === 2, ' LSP-SETTINGS_UPDATE_OWN should be present in 2 groups');

  countGroups = db.groups.find({ name: 'LSP_ADMIN', roles: { $elemMatch: { $eq: 'LSP-SETTINGS_READ_OWN' } } }).count(); // Should be 2
  assert(countGroups === 2, ' LSP-SETTINGS_READ_OWN should be present in 2 groups');

  print(' Confirming schedulers were duplicated for PTI and lspId was added to PTS schedulers');

  // Get protranslating and PTI id
  /*
  pts_id = db.lsp.find({ name: 'Protranslating' }, { _id: 1 });
  pti_id = db.lsp.find({ name: PTI }, { _id: 1 });
  */
  counter = db.schedulers.find({ lspId: { $exists: false } }).count(); // Should be 0
  assert(counter === 0, 'Number of schedulers without lspId should be 0');
  countSchedulers = db.schedulers.find({ name: { $in: ['provider-availability-email', 'forgotPassword', 'backup-notifications-monthly', 'quoted-request-creation-pm-email', 'quote-client-approved-pm-email', 'service-to-do-provider-notification', 'request-creation-pm-email', 'document-retention-policy'] } }, { lspId: 1 }).count(); // Should output 18
  assert(countSchedulers === 18, ' Should output 18');

  countSchedulers = db.schedulers.find({ lspId: PTS_ID }).count(); // Should be > 0
  assert(countSchedulers > 0, ' Schedulers number for PTS should be > 0');

  countSchedulers = db.schedulers.find({ lspId: PTI_ID }).count(); // Should be >= 8
  assert(countSchedulers >= 8, ' Schedulers number for PTI Should be >= 8');

  print(' Confirming migrations run by asserting there is a record for each of the below');

  migrationCount = db.lms_migrations.find({ name: '20180925210649' }).count();
  assert(migrationCount > 0, 'Query for 20180925210649 migration should be 1');

  migrationCount = db.lms_migrations.find({ name: '20180925214529' }).count();
  assert(migrationCount > 0, 'Query for 20180925214529 migration should be 1');

  migrationCount = db.lms_migrations.find({ name: '20180926141449' }).count();
  assert(migrationCount > 0, 'Query for 20180926141449 migration should be 1');

  migrationCount = db.lms_migrations.find({ name: '20180926141827' }).count();
  assert(migrationCount > 0, 'Query for 20180926141827 migration should be 1');

  migrationCount = db.lms_migrations.find({ name: '20180926173216' }).count();
  assert(migrationCount > 0, 'Query for 20180926173216 migration should be 1');

  migrationCount = db.lms_migrations.find({ name: '20180926235014' }).count();
  assert(migrationCount > 0, 'Query for 20180926235014 migration should be 1');

  migrationCount = db.lms_migrations.find({ name: '20180928132919' }).count();
  assert(migrationCount > 0, 'Query for 20180928132919 migration should be 1');

  migrationCount = db.lms_migrations.find({ name: '20181012183932' }).count();
  assert(migrationCount > 0, 'Query for 20181012183932 migration should be 1');

  migrationCount = db.lms_migrations.find({ name: '20181107150843' }).count();
  assert(migrationCount > 0, 'Query for 20181107150843 migration should be 1');

  migrationCount = db.lms_migrations.find({ name: '20181128144012' }).count();
  assert(migrationCount > 0, 'Query for 20181128144012 migration should be 1');

  migrationCount = db.lms_migrations.find({ name: '20181212211350' }).count();
  assert(migrationCount > 0, 'Query for 20181212211350 migration should be 1');

  migrationCount = db.lms_migrations.find({ name: '20181214153206' }).count();
  assert(migrationCount > 0, 'Query for 20181214153206 migration should be 1');

  migrationCount = db.lms_migrations.find({ name: '20181214163803' }).count();
  assert(migrationCount > 0, 'Query for 20181214163803 migration should be 1');

  migrationCount = db.lms_migrations.find({ name: '20181216171921' }).count();
  assert(migrationCount > 0, 'Query for 20181216171921 migration should be 1');

  migrationCount = db.lms_migrations.find({ name: '20181217174800' }).count();
  assert(migrationCount > 0, 'Query for migration 20181217174800 should be 1');

  migrationCount = db.lms_migrations.find({ name: '20181226152750' }).count();
  assert(migrationCount > 0, 'Query for 20181226152750 migration should be 1');

  migrationCount = db.lms_migrations.find({ name: '20181226161224' }).count();
  assert(migrationCount > 0, 'Query for 20181226161224 migration should be 1');

  migrationCount = db.lms_migrations.find({ name: '20181226165636' }).count();
  assert(migrationCount > 0, 'Query for 20181226165636 migration should be 1');

  migrationCount = db.lms_migrations.find({ name: '20181226170016' }).count();
  assert(migrationCount > 0, 'Query for 20181226170016 migration should be 1');

  migrationCount = db.lms_migrations.find({ name: '20181226211837' }).count();
  assert(migrationCount > 0, 'Query for 20181226211837 migration should be 1');

  migrationCount = db.lms_migrations.find({ name: '20181227195420' }).count();
  assert(migrationCount > 0, 'Query for 20181227195420 migration should be 1');
};
