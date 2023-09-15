const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const newRoles = ['CONTACT_CC_READ_CUSTOMER'];
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const roles = db.collection('roles');
    const groups = db.collection('groups');
    const users = db.collection('users');
    const promises = [];
    newRoles.forEach((r) => {
      promises.push(() => roles.update({ name: r }, { name: r }, { upsert: true }));
    });
    return Promise.all(promises.map(f => f()))
      .then(() => Promise.all(newRoles.map(r => groups.update({ name: 'CUSTOMER_STAFF' }, { $addToSet: { roles: r } }))))
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
            if (g.name === 'CUSTOMER_STAFF') {
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
