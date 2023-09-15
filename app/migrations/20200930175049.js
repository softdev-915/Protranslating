const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const usersCol = db.collection('users');
    return new Promise((resolve, reject) => {
      const stream = usersCol.find({ 'staffDetails.rates.0': { $exists: true } }).stream();
      stream.on('error', (err) => {
        reject(err);
      });
      stream.on('end', () => {
        resolve();
      });
      stream.on('data', (user) => {
        stream.pause();
        const rates = user.staffDetails.rates.map((r) => {
          if (!_.isEmpty(r.rateDetails)) {
            r.rateDetails = r.rateDetails.map((rateDetail) => {
              rateDetail.breakdown = rateDetail.fuzzyMatch;
              delete rateDetail.fuzzyMatch;
              return rateDetail;
            });
          }
          return r;
        });
        usersCol.updateOne({ _id: user._id }, {
          $set: {
            'staffDetails.rates': rates,
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
