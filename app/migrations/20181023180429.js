const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const abilities = db.collection('abilities');
    return abilities.updateMany({
      $or: [{
        name: 'Translation',
      }, {
        name: 'Editing',
      }],
    }, { $set: { competenceLevelRequired: true } });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
