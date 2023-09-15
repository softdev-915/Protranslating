const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const countriesToUpdate = [{
  oldName: 'Saint Martin (French part)',
  newName: 'Saint Martin',
},
];

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const countryCol = db.collection('countries');
    return Promise.map(countriesToUpdate, country => countryCol.updateOne({
      name: country.oldName,
    }, {
      $set: {
        name: country.newName,
      },
    }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
