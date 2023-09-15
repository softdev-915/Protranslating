const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const allRoles = [
  'CONTACT_READ_CUSTOMER',
  'CONTACT_READ_OWN',
  'CUSTOMER_READ_CUSTOMER',
  'CUSTOMER_READ_OWN',
  'INVOICE_READ_CUSTOMER',
  'INVOICE_READ_OWN',
  'INVOICE_UPDATE_CUSTOMER',
  'INVOICE_UPDATE_OWN',
  'QUOTE_READ_CUSTOMER',
  'QUOTE_READ_OWN',
  'QUOTE_UPDATE_CUSTOMER',
  'QUOTE_UPDATE_OWN',
  'REQUEST_CREATE_CUSTOMER',
  'REQUEST_CREATE_OWN',
  'REQUEST_READ_CUSTOMER',
  'REQUEST_READ_OWN',
  'REQUEST_UPDATE_CUSTOMER',
  'REQUEST_UPDATE_OWN',
];
let newGroups = [
  {
    name: 'CUSTOMER_ADMIN',
    roles: [
      'REQUEST_CREATE_CUSTOMER',
      'REQUEST_CREATE_OWN',
      'REQUEST_READ_CUSTOMER',
      'REQUEST_READ_OWN',
      'REQUEST_UPDATE_CUSTOMER',
      'REQUEST_UPDATE_OWN',
      'CUSTOMER_READ_CUSTOMER',
      'CUSTOMER_READ_OWN',
      'CONTACT_READ_CUSTOMER',
      'CONTACT_READ_OWN',
      'QUOTE_READ_CUSTOMER',
      'QUOTE_READ_OWN',
      'QUOTE_UPDATE_CUSTOMER',
      'QUOTE_UPDATE_OWN',
      'INVOICE_READ_CUSTOMER',
      'INVOICE_READ_OWN',
      'INVOICE_UPDATE_CUSTOMER',
      'INVOICE_UPDATE_OWN',
    ],
  }, {
    name: 'CUSTOMER_MANAGER',
    roles: [
      'REQUEST_CREATE_CUSTOMER',
      'REQUEST_CREATE_OWN',
      'REQUEST_READ_CUSTOMER',
      'REQUEST_READ_OWN',
      'REQUEST_UPDATE_CUSTOMER',
      'REQUEST_UPDATE_OWN',
      'CUSTOMER_READ_CUSTOMER',
      'CUSTOMER_READ_OWN',
      'CONTACT_READ_CUSTOMER',
      'CONTACT_READ_OWN',
      'QUOTE_READ_CUSTOMER',
      'QUOTE_READ_OWN',
      'QUOTE_UPDATE_CUSTOMER',
      'QUOTE_UPDATE_OWN',
      'INVOICE_READ_CUSTOMER',
      'INVOICE_READ_OWN',
      'INVOICE_UPDATE_CUSTOMER',
      'INVOICE_UPDATE_OWN',
    ],
  }, {
    name: 'CUSTOMER_STAFF',
    roles: [
      'REQUEST_CREATE_OWN',
      'REQUEST_READ_OWN',
      'REQUEST_UPDATE_OWN',
      'CUSTOMER_READ_OWN',
      'CONTACT_READ_OWN',
      'QUOTE_READ_OWN',
      'QUOTE_UPDATE_OWN',
      'INVOICE_READ_OWN',
      'INVOICE_UPDATE_OWN',
    ],
  },
];

// TODO: Update users that belong to those groups
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    let pts;
    const lsp = db.collection('lsp');
    const groups = db.collection('groups');
    const roles = db.collection('roles');
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
          promises.push(() => roles.findOneAndUpdate(
            { name: r },
            { $set: { name: r } },
            { upsert: true },
            (err) => {
              if (err) throw new Error(`Error updating roles, ${err}`);
            }));
        });
        return Promise.all(promises.map(f => f()));
      })
      .then(() => {
        const promises = [];
        newGroups = newGroups.map((g) => {
          g.lspId = pts._id;
          return g;
        });

        newGroups.forEach((ng) => {
          promises.push(() => groups.findOneAndUpdate(
            { name: ng.name, lspId: ng.lspId },
            { $set: { name: ng.name, lspId: ng.lspId } },
            { upsert: true },
            (err) => {
              if (err) throw new Error(`Error updating groups, ${err}`);
            }));
        });
        return Promise.all(promises.map(f => f()));
      })
      .then(() => {
        const promises = [];
        newGroups.forEach((ng) => {
          promises.push(() => groups.findOneAndUpdate(
            { name: ng.name, lspId: ng.lspId },
            { $addToSet: { roles: { $each: ng.roles } } },
            (err) => {
              if (err) throw new Error(`Error updating groups, ${err}`);
            }));
        });
        return Promise.all(promises.map(f => f()));
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
