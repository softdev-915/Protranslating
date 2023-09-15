
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const companiesCol = db.collection('companies');
    const query = {
      'billingInformation.rates.sourceLanguage.isoCode': 'EN-EN',
    };
    const update = {
      $set: {
        'billingInformation.rates.$[rate].sourceLanguage.isoCode': 'ENG',
      },
    };
    const options = {
      upsert: false,
      multi: true,
      arrayFilters: [
        {
          'rate.sourceLanguage': {
            isoCode: 'EN-EN',
          },
        },
      ],
    };
    return companiesCol.updateMany(query, update, options);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
