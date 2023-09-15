const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const usersDb = db.collection('users');
    return usersDb.find({
      $or: [{
        type: 'Vendor',
      },
      {
        type: 'Staff',
      },
      ],
    }).toArray()
      .then(users =>
        Promise.mapSeries(users, (u) => {
          if (u.rates) {
            let updateSet;
            if (u.type === 'Vendor') {
              updateSet = {
                'vendorDetails.rates': u.rates,
              };
            } else {
              updateSet = {
                'staffDetails.rates': u.rates,
              };
            }
            return usersDb.update({
              _id: u._id,
            }, {
              $set: updateSet,
            });
          }
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
