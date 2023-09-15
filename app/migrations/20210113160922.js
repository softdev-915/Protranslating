const mongo = require('../components/database/mongo');
const _ = require('lodash');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const usersCol = db.collection('users');
    const abilitiesCol = db.collection('abilities');
    return new Promise((resolve, reject) => {
      const stream = usersCol.find({ 'vendorDetails.rates.0': { $exists: true } }).stream();
      stream.on('error', (err) => {
        reject(err);
      });
      stream.on('end', () => {
        resolve();
      });
      stream.on('data', async (user) => {
        stream.pause();
        const rates = await Promise.map(user.vendorDetails.rates, async (userRate) => {
          const userRateAbility = _.get(userRate, 'ability._id', '');
          if (_.isEmpty(userRateAbility)) return userRate;
          const ability = await abilitiesCol.findOne({ _id: userRateAbility._id });
          _.set(userRate, 'ability.languageCombination', ability.languageCombination);
          return userRate;
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
