const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const collections = {
      users: db.collection('users'),
    };
    return collections.users.find({ 'accounts.abilities': { $exists: true } }).toArray()
      .then(users => Promise.map(users, (u) => {
        const abilities = u.accounts[0].abilities;
        if (abilities && abilities.length) {
          const fixedAbilities = abilities.map((a) => {
            if (Array.isArray(a)) {
              return a[0].name;
            } else if (typeof a === 'object') {
              return a.name;
            }
            return a;
          });
          return collections.users.updateOne({ _id: u._id }, {
            $set: {
              'accounts.0.abilities': fixedAbilities,
            },
          });
        }
      }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
