const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const missingCountries = [
  {
    name: 'Kosovo',
    code: 'XK',
  }, {
    name: 'Netherlands Antilles',
    code: 'AN',
  }];

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const countryCol = db.collection('countries');
    return Promise.map(missingCountries, country => countryCol.updateOne({
      name: country.name,
    }, {
      $set: country,
    }, { upsert: true }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
