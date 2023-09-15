const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const newRoles = [
  'STAFF_CREATE_ALL',
  'VENDOR_CREATE_ALL',
];

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const roles = db.collection('roles');
    const groups = db.collection('groups');
    const users = db.collection('users');
    return Promise.map(newRoles, r =>
      roles.update({ name: r }, { $set: { name: r } }, { upsert: true }))
      .then(() => Promise.all(newRoles.map(r => groups.update({ name: 'LSP_ADMIN' }, { $addToSet: { roles: r } }))))
      .then(() => users.find({}))
      .then(userList => userList.toArray())
      .then(userArray => Promise.all(userArray.map((u) => {
        if (!u.firstName) {
          u.firstName = 'Unknown';
        }
        if (!u.lastName) {
          u.lastName = 'Unknown';
        }
        u.accounts = u.accounts.map((a) => {
          if (!a.type) {
            a.type = 'Unknown';
          }
          a.groups = a.groups.map((g) => {
            if (g.name === 'LSP_ADMIN') {
              newRoles.forEach((r) => {
                if (g.roles.indexOf(r) === -1) {
                  g.roles.push(r);
                }
              });
            }
            return g;
          });
          return a;
        });
        return users.update({ _id: u._id }, u);
      })));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
