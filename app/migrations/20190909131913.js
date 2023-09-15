const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const usersCollection = db.collection('users');
    const abilitiesCollection = db.collection('abilities');
    return abilitiesCollection
      .find({})
      .toArray()
      .then(abilities =>
        usersCollection
          .find({
            $or: [{
              type: 'Vendor',
            },
            {
              type: 'Staff',
            },
            ],
          })
          .toArray()
          .then((users) => {
            users.forEach((user) => {
              if (user.rates && user.rates.length > 0) {
                const rates = user.rates;

                rates.forEach((rate) => {
                  const rateAblitiy = rate.ability;
                  if (rateAblitiy) {
                    const lspAbilityMatch = abilities.find(a =>
                      a.lspId.equals(user.lsp) && a.name === rateAblitiy.name);
                    if (lspAbilityMatch) {
                      rate.ability = {
                        name: lspAbilityMatch.name,
                        _id: lspAbilityMatch._id,
                      };
                    }
                  }
                });
                user.rates = rates;
              }
            });
            return Promise.mapSeries(users, (u) => {
              if (u.rates) {
                if (u.type === 'Staff') {
                  return usersCollection.update({
                    _id: u._id,
                  }, {
                    $set: {
                      'staffDetails.rates': u.rates,
                    },
                  });
                }
                return usersCollection.update({
                  _id: u._id,
                }, {
                  $set: {
                    'vendorDetails.rates': u.rates,
                  },
                });
              }
            });
          }),
      );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => {
    throw err;
  });
} else {
  module.exports = migration;
}
