const { Types: { ObjectId } } = require('mongoose');
const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then((connections) => connections.mongoose.connection)
  .then((db) => {
    const usersCol = db.collection('users');
    return new Promise((resolve, reject) => {
      const stream = usersCol.find({ 'vendorDetails.rates.0': { $exists: true } }).stream();
      stream.on('error', (err) => {
        reject(err);
      });
      stream.on('end', () => {
        resolve();
      });
      stream.on('data', (user) => {
        stream.pause();
        const rates = user.vendorDetails.rates.map((rate) => {
          if (_.isEmpty(rate._id)) {
            rate._id = new ObjectId();
          }
          return rate;
        });
        usersCol.updateOne({ _id: user._id }, {
          $set: {
            'vendorDetails.rates': rates,
          },
        }).then(() => {
          stream.resume();
        });
      });
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
