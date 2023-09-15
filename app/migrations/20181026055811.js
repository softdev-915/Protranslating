const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { insertIfMissing } = require('../utils/migrations');

const newScheduler = {
  name: 'quote-pending-approval-contact',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'support@protranslating.com',
    template: '<h2>Client Module: New Quote</h2><p> A quote on your request has been made by ProTranslating and is waiting for your approval.</p><p>Request Number:  {{request.no}}</p><p>Document name(s):  {{#each documents}}{{name}}, {{/each}}</p><p>Request title: {{request.title}}</p><p>Turnaround time: {{request.turnaroundTime}}</p><p><a href="{{path}}requests/{{request._id}}/details/quote" target="_blank">Go to Quote Approval</a></p>',
    subject: 'Quote to approve',
    variables: {
      path: 'https://portal.protranslating.com/',
      user: {
        firstName: 'Email',
        lastName: 'Receiver',
        email: 'email-receiver@protranslating.com',
      },
      documents: [{
        name: 'Document name',
      },
      {
        name: 'Other Document name',
        final: true,
      }],
      request: {
        _id: 'request-id',
        no: 'request-#',
        title: 'New translation request',
        turnaroundTime: new Date(),
      },
    },
  },
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    const schedulersCol = db.collection('schedulers');
    const lspCol = db.collection('lsp');
    const findQuery = {
      name: 'quote-pending-approval-contact',
    };
    return lspCol.find({}).toArray()
      .then((lspList) => {
        if (lspList && lspList.length < 2) {
          throw new Error('An LSP is missing');
        }
        return lspList;
      })
      .then((lspList) => {
        const pts = lspList.find(lsp => lsp.name === 'Protranslating');
        const pti = lspList.find(lsp => lsp.name === 'PTI');
        if (pts && pti) {
          const promisesList = [
            () => insertIfMissing(schedulersCol, findQuery, newScheduler, pts),
            () => insertIfMissing(schedulersCol, findQuery, newScheduler, pti),
          ];
          return Promise.mapSeries(promisesList, promise => promise());
        }
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
