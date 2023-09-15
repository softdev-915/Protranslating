
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const requestsCol = db.collection('requests');
    const update = {
      $pull: {
        'languageCombinations.$[].documents': { final: true },
      },
    };
    const options = { multi: true };
    return requestsCol.update({ languageCombinations: { $exists: true } }, update, options);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
