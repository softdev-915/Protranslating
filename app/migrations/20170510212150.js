const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    let pts;
    const lsp = db.collection('lsp');
    const users = db.collection('users');
    const groups = db.collection('groups');
    const lspName = 'Protranslating';
    return lsp.findOne({ name: lspName })
      .then((protranslating) => {
        pts = protranslating;
        return protranslating;
      })
      .then(() => groups.findOne({ name: 'LSP_ADMIN' }))
      .then(group => users.update({
        email: 'e2e@sample.com',
      }, {
        $set: {
          email: 'e2e@sample.com',
          accounts: [{
            lsp: pts,
            roles: [],
            groups: [group],
          }],
        },
      }, {
        upsert: true,
      }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
