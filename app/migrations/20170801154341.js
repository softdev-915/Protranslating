const Promise = require('bluebird');
const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { updateUsersGroup } = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    let roles;
    let group;
    const collections = {
      roles: db.collection('roles'),
      groups: db.collection('groups'),
      users: db.collection('users'),
    };
    return Promise.all([
      collections.roles.find({}).toArray(),
      collections.groups.find({}).toArray(),
    ])
      .then((results) => {
        let rolesPromise;
        const originalRoles = results[0];
        const originalNames = originalRoles.map(or => or.name);
        roles = originalRoles.map(r => r.name);
        const groups = results[1];
        group = groups.find(g => g.name === 'LSP_ADMIN');
        const allGroupsRoles = groups.map(g => g.roles).reduce((arr, cur) => arr.concat(cur)).filter(r => typeof r === 'string');
        roles = roles.concat(allGroupsRoles).concat(['QUOTE_READ_ALL']);
        roles = _.uniq(roles);
        const rolesToAdd = roles.filter(r => originalNames.indexOf(r) === -1);
        if (rolesToAdd.length) {
          rolesPromise = collections.roles.insert(rolesToAdd.map(r => ({ name: r })));
        } else {
          rolesPromise = Promise.resolve();
        }
        return Promise.all([
          rolesPromise,
          collections.groups.updateOne({ _id: group._id }, { $set: { roles } }),
        ]);
      }).then(() => updateUsersGroup('LSP_ADMIN', roles, collections))
      .catch((err) => {
        throw err;
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
