const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    // write your migration logic here.
    const grids = db.collection('grids');
    return grids.updateMany(
      { 'grids.grid': 'userInlineGrid' },
      { $set: { 'grids.$[].configs.$[].columns.$[column].name': 'Inactive' } },
      { arrayFilters: [{ 'column.name': 'Deleted' }] },
    );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
