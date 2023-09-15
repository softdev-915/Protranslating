const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const billPaidEmail = {
  name: 'bill-paid-provider',
  lspId: 'lsp ID',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'support@protranslating.com',
    to: '{{user.email}}',
    template: `
    <p><strong><ins>Portal Module: Bill Paid</ins></strong><p>
    A bill for your task has been paid by {{lspName}}.<br>
    <p>Request Number: {{request.no}}</p>
    <p>transaction Number: {{transaction.no}}</p>
    <p>Transaction Type:  Bill </p>
    <p>Language(s):  {{#each languages}}{{this}},{{/each.name}} </p>
    <p>Ability(s):  {{#each abilities}}{{this}},{{/each}} </p>
    <p>Total: {{total}} </p>
    <a href="{{path}}transactions/{{transaction._id}}/details" target="_blank">Go to Bill</a><br>
    `,
    subject: 'Payment Sent',
    variables: {
      lspName: '',
      path: 'https://portal.protranslating.com/',
      request: {
        no: '',
      },
      transaction: {
        _id: '',
        no: '',
      },
      user: {
        email: '',
      },
      abilities: [],
      languages: [],
      total: '',
    },
  },
};

const insertOrUpdate = (schedulers, transactionEmail) =>
  schedulers.findOne({ name: transactionEmail.name, lspId: transactionEmail.lspId })
    .then((scheduler) => {
      if (!scheduler) {
        return schedulers.insertOne(transactionEmail);
      }
      return schedulers.update({ name: transactionEmail.name }, { $set: transactionEmail });
    });

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const schedulers = db.collection('schedulers');
    return db.collection('lsp').find({ $or: [{ name: 'Protranslating' }, { name: 'PTI' }] }).toArray()
      .then((lsps) => {
        if (lsps && lsps.length) {
          return Promise.all(lsps.map((lsp) => {
            const schedulerToInsert = Object.assign({}, billPaidEmail);
            schedulerToInsert.lspId = lsp._id;
            return insertOrUpdate(schedulers, schedulerToInsert);
          }));
        }
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}

