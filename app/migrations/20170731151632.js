const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const groups = db.collection('groups');
    return groups.findOne({ name: 'LSP_VENDOR' })
      .then((g) => {
        if (!g) {
          return groups.findOne({ name: 'LSP_STAFF' })
            .then((staffGroup) => {
              staffGroup.name = 'LSP_VENDOR';
              delete staffGroup._id;
              return groups.insert(staffGroup);
            });
        }
      });
    // write your migration logic here.
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
