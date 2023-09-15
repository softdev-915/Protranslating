const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const allRoles = [
  'USER_CREATE_ALL', 'USER_READ_ALL', 'USER_UPDATE_ALL', 'USER_DELETE_ALL',
  'GROUP_CREATE_ALL', 'GROUP_READ_ALL', 'GROUP_UPDATE_ALL', 'GROUP_DELETE_ALL',
  'ROLE_READ_ALL',
  'REQUEST_CREATE_ALL', 'REQUEST_READ_ALL', 'REQUEST_UPDATE_ALL', 'REQUEST_DELETE_ALL',
  'REQUEST_CREATE_CUSTOMER', 'REQUEST_READ_CUSTOMER', 'REQUEST_UPDATE_CUSTOMER', 'REQUEST_DELETE_CUSTOMER',
  'REQUEST_CREATE_OWN', 'REQUEST_READ_OWN', 'REQUEST_UPDATE_OWN',
  'CUSTOMER_CREATE_ALL', 'CUSTOMER_READ_ALL', 'CUSTOMER_UPDATE_ALL', 'CUSTOMER_DELETE_ALL',
  'CUSTOMER_READ_OWN',
  'CONTACT_CREATE_ALL', 'CONTACT_READ_ALL', 'CONTACT_UPDATE_ALL', 'CONTACT_DELETE_ALL',
  'CONTACT_READ_CUSTOMER',
  'CONTACT_READ_OWN',
  'SCHEDULER_READ_ALL', 'SCHEDULER_CREATE_ALL', 'SCHEDULER_UPDATE_ALL',
  'NOTIFICATION_READ_ALL', 'NOTIFICATION_CREATE_ALL', 'NOTIFICATION_UPDATE_ALL',
  'DOCUMENTATION_UPDATE_ALL',
];

const newGroups = [
  { name: 'LSP_ADMIN', roles: ['USER_CREATE_ALL', 'USER_READ_ALL', 'USER_UPDATE_ALL', 'USER_DELETE_ALL', 'GROUP_CREATE_ALL', 'GROUP_READ_ALL', 'GROUP_UPDATE_ALL', 'GROUP_DELETE_ALL', 'ROLE_READ_ALL', 'REQUEST_CREATE_ALL', 'REQUEST_READ_ALL', 'REQUEST_UPDATE_ALL', 'REQUEST_DELETE_ALL', 'REQUEST_CREATE_CUSTOMER', 'REQUEST_READ_CUSTOMER', 'REQUEST_UPDATE_CUSTOMER', 'REQUEST_DELETE_CUSTOMER', 'REQUEST_CREATE_OWN', 'REQUEST_READ_OWN', 'REQUEST_UPDATE_OWN', 'CUSTOMER_CREATE_ALL', 'CUSTOMER_READ_ALL', 'CUSTOMER_UPDATE_ALL', 'CUSTOMER_DELETE_ALL', 'CUSTOMER_READ_OWN', 'CONTACT_CREATE_ALL', 'CONTACT_READ_ALL', 'CONTACT_UPDATE_ALL', 'CONTACT_DELETE_ALL', 'CONTACT_READ_CUSTOMER', 'CONTACT_READ_OWN', 'SCHEDULER_READ_ALL', 'SCHEDULER_CREATE_ALL', 'SCHEDULER_UPDATE_ALL', 'NOTIFICATION_READ_ALL', 'NOTIFICATION_CREATE_ALL', 'NOTIFICATION_UPDATE_ALL', 'DOCUMENTATION_UPDATE_ALL'] },
  { name: 'LSP_PM', roles: ['USER_READ_ALL', 'GROUP_READ_ALL', 'ROLE_READ_ALL', 'REQUEST_CREATE_ALL', 'REQUEST_READ_ALL', 'REQUEST_UPDATE_ALL', 'REQUEST_DELETE_ALL', 'CUSTOMER_CREATE_ALL', 'CUSTOMER_READ_ALL', 'CUSTOMER_UPDATE_ALL', 'CUSTOMER_DELETE_ALL', 'CONTACT_CREATE_ALL', 'CONTACT_READ_ALL', 'CONTACT_UPDATE_ALL', 'CONTACT_DELETE_ALL'] },
  { name: 'LSP_STAFF', roles: ['USER_READ_ALL', 'GROUP_READ_ALL', 'ROLE_READ_ALL', 'REQUEST_READ_ALL', 'CUSTOMER_READ_ALL', 'CONTACT_CREATE_ALL', 'CONTACT_READ_ALL', 'CONTACT_UPDATE_ALL', 'CONTACT_DELETE_ALL'] },
  { name: 'CUSTOMER_ADMIN', roles: ['CUSTOMER_READ_OWN', 'CONTACT_READ_CUSTOMER', 'CONTACT_READ_OWN', 'REQUEST_CREATE_CUSTOMER', 'REQUEST_READ_CUSTOMER', 'REQUEST_UPDATE_CUSTOMER', 'REQUEST_CREATE_OWN', 'REQUEST_READ_OWN', 'REQUEST_UPDATE_OWN'] },
  { name: 'CUSTOMER_STAFF', roles: ['REQUEST_CREATE_OWN', 'REQUEST_READ_OWN', 'REQUEST_UPDATE_OWN'] },
];

const forgotPasswordScheduler = {
  name: 'forgotPassword',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
  },
  email: {
    from: 'support@protranslating.com',
  },
};
const recaptcha = { name: 'recaptcha', options: { secret: '6LfXTxYUAAAAAB59Kj15uHTWtq2lKUFEwDVf8MHQ' } };
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    let pts;
    const lsp = db.collection('lsp');
    const users = db.collection('users');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
    const schedulers = db.collection('schedulers');
    const externalAPIS = db.collection('external_apis');
    const lspName = 'Protranslating';
    return lsp.findOne({ name: lspName })
      .then((protranslating) => {
        if (protranslating) {
          return protranslating;
        }
        return lsp.insert({ name: lspName })
          .then(insertResult => ({ _id: insertResult.ops[0]._id, name: lspName }));
      })
      .then((protranslating) => {
        pts = protranslating;
        const promises = [];
        allRoles.forEach((r) => {
          promises.push(() => roles.update({ name: r }, { $set: { name: r } }, { upsert: true }));
        });
        return Promise.all(promises.map(f => f()));
      })
      .then(() => {
        const promises = [];
        newGroups.map((g) => {
          g.lspId = pts._id;
          return g;
        }).forEach((ng) => {
          promises.push(() => groups.insert(ng));
        });
        return Promise.map(newGroups, g =>
          groups.findOne({ name: g.name, lspId: pts._id })
            .then((dbGroup) => {
              if (dbGroup) {
                return groups.update({ name: g.name }, { $set: { lspId: pts._id } });
              }
              g.lspId = pts._id;
              return groups.insert(g);
            }));
      })
      .then(() => groups.findOne({ name: 'LSP_ADMIN' }))
      .then(group => users.insert({
        email: 'ptzankova@protranslating.com',
        accounts: [{
          lsp: pts,
          roles: [],
          groups: [group],
        }],
      }))
      .then(() => schedulers.createIndex({ name: 1 }, { unique: true }))
      .then(() => schedulers.findOne({ name: forgotPasswordScheduler.name }))
      .then((scheduler) => {
        if (!scheduler) {
          return schedulers.insert(forgotPasswordScheduler);
        }
      })
      .then(() => externalAPIS.findOne({ name: recaptcha.name }).then((dbRecaptcha) => {
        if (dbRecaptcha) {
          return externalAPIS.update({ name: recaptcha.name },
            { $set: { options: { secret: '6LfXTxYUAAAAAB59Kj15uHTWtq2lKUFEwDVf8MHQ' } } });
        }
        return externalAPIS.insert(recaptcha);
      }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
