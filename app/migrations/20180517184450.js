const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { countries } = require('./data/20180517184450/countries.json');
const { states } = require('./data/20180517184450/states.json');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const stateCollection = db.collection('states');
    const countryCollection = db.collection('countries');
    return Promise.map(countries, c => countryCollection.findOneAndUpdate({ $or: [
      { name: c.name },
      { code: c.code },
    ] }, { $set: {
      name: c.name,
      code: c.code,
    } }, { upsert: true, returnOriginal: false })
      .then(country =>
        Promise.map(states.filter(s => s.country === country.value.code), s => stateCollection
          .update({
            $or: [
              { name: s.name },
              { code: s.code },
            ],
          }, { $set: {
            name: s.name,
            code: s.code,
            country: country.value._id,
          } }, {
            upsert: true,
          }), { concurrency: 1 }),
      ), { concurrency: 1 });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
