const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const users = db.collection('users');
  const groups = db.collection('groups');
  const roles = db.collection('roles');
  const epoDisclaimers = db.collection('ip_epo_disclaimers');
  const wipoDisclaimers = db.collection('ip_wipo_disclaimers');
  const nodbDisclaimers = db.collection('ip_nodb_disclaimers');
  const lspCol = db.collection('lsp');
  const bigIpLsp = await lspCol.findOne({ name: 'BIG IP' });
  if (_.isNil(bigIpLsp)) return;
  const collections = {
    users,
    groups,
    roles,
  };
  await addNewRole([
    'IP-INSTRUCTIONS-DEADLINE_CREATE_ALL',
    'IP-INSTRUCTIONS-DEADLINE_READ_ALL',
    'IP-INSTRUCTIONS-DEADLINE_UPDATE_ALL',
  ], ['LSP_ADMIN'], collections);
  const ipInstructionDeadlineDisclaimer = {
    translationOnly: true,
    codes: [],
    disclaimer: 'In order to avoid any rush fees, we would appreciate receiving instructions at least {{notice period}} before the deadline.',
    lspId: bigIpLsp._id,
    rule: 'IP-INSTRUCTIONS-DEADLINE > Notice based on Total or Claims Word Count',
    sameTranslation: true,
  };
  await epoDisclaimers.insertOne({ countries: 'ALL', ...ipInstructionDeadlineDisclaimer, translationAndFiling: true });
  await wipoDisclaimers.insertOne({ country: 'ALL', ...ipInstructionDeadlineDisclaimer, translationAndFilling: true });
  await nodbDisclaimers.insertOne({ country: 'ALL', ...ipInstructionDeadlineDisclaimer, translationAndFiling: true });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
