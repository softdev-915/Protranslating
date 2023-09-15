const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    const companiesCol = db.collection('companies');
    const languages = await db.collection('languages').find({}).toArray();
    return new Promise((resolve, reject) => {
      const stream = companiesCol.find({ 'billingInformation.rates.0': { $exists: true } }).stream();
      stream.on('error', (err) => {
        reject(err);
      });
      stream.on('end', () => {
        resolve();
      });
      stream.on('data', (company) => {
        stream.pause();
        const rates = company.billingInformation.rates.map((rate) => {
          let language;
          if (!_.isEmpty(rate.sourceLanguage)) {
            language = languages.find(l => l.isoCode === rate.sourceLanguage.isoCode);
            rate.sourceLanguage = _.pick(language, ['_id', 'name', 'isoCode']);
          }
          if (!_.isEmpty(rate.targetLanguage)) {
            language = languages.find(l => l.isoCode === rate.targetLanguage.isoCode);
            rate.targetLanguage = _.pick(language, ['_id', 'name', 'isoCode']);
          }
          return rate;
        });
        if (!_.isEmpty(rates)) {
          companiesCol.updateOne({ _id: company._id }, {
            $set: {
              'billingInformation.rates': rates,
            },
          }).then(() => {
            stream.resume();
          });
        } else {
          stream.resume();
        }
      });
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
