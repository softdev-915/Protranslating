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
  const lsp = db.collection('lsp');
  const bigIp = await lsp.findOne({ name: 'BIG IP' });
  if (_.isNil(bigIp)) return Promise.resolve();
  const collections = {
    users,
    groups,
    roles,
  };
  await addNewRole([
    'IP-QUOTE_UPDATE_OWN',
  ],
  [{ name: 'COMPANY_IP-REQUEST', lspId: bigIp._id }], collections);
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
