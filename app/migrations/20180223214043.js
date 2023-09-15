const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const groupsAffected = ['LSP_ADMIN', 'LMS_HR'];
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lsp = db.collection('lsp');
    const users = db.collection('users');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
    let lspId;
    const lspName = 'Protranslating';
    return lsp.findOne({ name: lspName })
      .then((protranslating) => {
        lspId = protranslating._id;
        return protranslating;
      })
      .then(() => roles.findOne({ name: 'STAFF-FILE-MANAGEMENT_UPDATE_ALL' }))
      .then((role) => {
        if (!role) {
          return roles.insert({
            name: 'STAFF-FILE-MANAGEMENT_UPDATE_ALL',
          });
        }
        return role;
      })
      .then(() => groups.update({}, {
        $pullAll: { roles: ['STAFF-FILE-MANAGEMENT_UPDATE_ALL'] },
      }, { multi: true }))
      .then(() => groups.findOne({ name: 'LMS_HR', lspId }))
      .then((group) => {
        if (!group) {
          return groups.insert({
            name: 'LMS_HR',
            roles: [],
            lspId,
          });
        }
        return group;
      })
      .then(() => groups.update({ $or: [{ name: 'LSP_ADMIN' }, { name: 'LMS_HR' }] }, {
        $addToSet: { roles: 'STAFF-FILE-MANAGEMENT_UPDATE_ALL' },
      }, { multi: true }))
      .then(() => users.find().toArray())
      .then((allUsers) => {
        const promises = [];
        allUsers.forEach((user) => {
          if (user.accounts && Array.isArray(user.accounts)) {
            user.accounts.forEach((a) => {
              if (a.groups && Array.isArray(a.groups)) {
                a.groups.forEach((g) => {
                  if (g.roles && Array.isArray(g.roles)) {
                    g.roles = g.roles.filter(r => r !== 'STAFF-FILE-MANAGEMENT_UPDATE_ALL');
                    if (groupsAffected.includes(g.name)) {
                      g.roles.push('STAFF-FILE-MANAGEMENT_UPDATE_ALL');
                    }
                    promises.push(() => users.update({ _id: user._id }, user));
                  }
                });
              }
            });
          }
        });
        return Promise.resolve(promises).mapSeries(f => f());
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
