const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const documentation = db.collection('documentation');
    return documentation.find().toArray()
      .then(documentationItems => Promise.map(documentationItems, d => documentation.updateOne({
        _id: d._id,
      }, {
        $set: { roles: 'DOCUMENTATION_READ_ALL' },
      })));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
