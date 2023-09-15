const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

let lspCol;
let requestCol;
let usersCol;
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    lspCol = db.collection('lsp');
    requestCol = db.collection('requests');
    usersCol = db.collection('users');
    return lspCol.findOne({ name: 'Protranslating' }).then((lsp) => {
      const query = { lspId: { $exists: false } };
      const update = { $set: { lspId: lsp._id } };
      return requestCol.update(query, update, { multi: true });
    })
      .then(() => (usersCol.getIndexes()))
      .then((indexesNames) => {
        if (Object.keys(indexesNames).indexOf('email_1') >= 0) {
          return usersCol.dropIndex({ email: 1 });
        }
      });
    // write your migration logic here.
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
