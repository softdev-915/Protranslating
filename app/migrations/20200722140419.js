
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const usersCol = db.collection('users');
    const query = {
      'vendorDetails.rates.targetLanguage.isoCode': 'EN-EN',
    };
    const update = {
      $set: {
        'vendorDetails.rates.$[rate].targetLanguage.isoCode': 'ENG',
      },
    };
    const options = {
      upsert: false,
      multi: true,
      arrayFilters: [
        {
          'rate.targetLanguage': {
            isoCode: 'EN-EN',
          },
        },
      ],
    };
    return usersCol.updateMany(query, update, options);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
