const { Types: { ObjectId } } = require('mongoose');
const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then((connections) => connections.mongoose.connection)
  .then(async (db) => {
    const companiesCol = db.collection('companies');
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
          if (_.isEmpty(rate._id)) {
            rate._id = new ObjectId();
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
