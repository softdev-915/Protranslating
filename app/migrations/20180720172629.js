const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { states } = require('./data/20180517184450/states.json');

// Migration to add missing states that were incorrectly replaced when inserted
// in migration 20180517184450

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const countryCollection = db.collection('countries');
    const stateCollection = db.collection('states');
    return countryCollection.find().toArray()
      .then(countries => Promise
        .map(countries, c => Promise.map(states
          .filter(s => s.country === c.code), s => stateCollection
          .update({ $and: [
            { name: s.name },
            { code: s.code },
          ] }, { $setOnInsert: {
            name: s.name,
            code: s.code,
            country: c._id,
          } }, { upsert: true })),
        { concurrency: 1 }),
      { concurrency: 1 });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
