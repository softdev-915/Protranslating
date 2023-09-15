/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    const usersCol = db.collection('users');
    const bulk = usersCol.initializeUnorderedBulkOp();
    const cursor = usersCol.find({
      accounts: {
        $elemMatch: {
          'lsp.name': 'Protranslating',
        },
      },
    });
    while (await cursor.hasNext()) {
      const u = await cursor.next();
      const ptIndex = u.accounts.findIndex(a => a.lsp.name === 'Protranslating');
      if (ptIndex !== -1) {
        const ssoAccounts = u.accounts[0].ssoAccounts;
        // Avoid copying metadata as the top level already has it
        const accountKeysToExclude = ['ssoAccounts', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt'];
        const accountInfo = Object.assign({}, _.omit(u.accounts[0], accountKeysToExclude));
        const oneLoginAccount = _.get(ssoAccounts, '0');
        delete u.accounts;
        if (oneLoginAccount) {
          accountInfo.oneLogin = {
            id: oneLoginAccount.id,
          };
        }
        u.inactive = _.get(accountInfo, 'deleted', false);
        u.lsp = accountInfo.lsp._id;
        delete accountInfo.deleted;
        Object.assign(u, _.omit(accountInfo, 'lsp'));
        // Copy account info to top level
        bulk.find({ _id: u._id }).updateOne({
          $set: u,
          $unset: { accounts: undefined },
        });
      }
    }
    if (bulk.length > 0) {
      await bulk.execute();
    }
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
