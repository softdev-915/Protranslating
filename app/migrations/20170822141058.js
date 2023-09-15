const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const collections = {
      users: db.collection('users'),
      groups: db.collection('groups'),
    };
    return collections.groups.updateOne({
      name: 'LMS_STAFF',
    }, {
      $pull: { roles: { $in: ['REQUEST_READ_ALL'] } },
    }).then(() => collections.groups.updateOne({
      name: 'LMS_VENDOR',
    }, {
      $pull: { roles: { $in: ['REQUEST_READ_ALL'] } },
    })).then(() => collections.users.find({
      'accounts.groups': {
        $elemMatch: {
          name: { $in: ['LSP_STAFF', 'LSP_VENDOR'] },
        },
      },
    }).toArray().then(users => Promise.map(users, (u) => {
      const groups = u.accounts[0].groups.map((g) => {
        if (g.name === 'LSP_STAFF' || g.name === 'LSP_VENDOR') {
          const found = g.roles.indexOf('REQUEST_READ_ALL');
          if (found !== -1) {
            g.roles.splice(found, 1);
          }
        }
        return g;
      });
      return collections.users.updateOne({
        _id: u._id,
      }, {
        $set: {
          'accounts.0.groups': groups,
        },
      });
    })));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
