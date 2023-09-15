const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const requestCompletedEmail = {
  name: 'request-completed-email',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'support@protranslating.com',
    template: '<h2>Delivery for a completed service</h2><p>{{request.customer.name}} has completed a service. You can retrieve the document(s).</p><p>Request Number:  {{request.no}}</p><p>Delivered on:  {{request.deliveryDate}}</p>{{#if deliveringProvider}}<p>Delivered By: {{deliveringProvider.firstName}} {{deliveringProvider.lastName}}</p>{{/if}}<p>Document(s):  {{#each finalDocuments}}{{name}}, {{/each}}</p><p>Click on the following link:</p><p><a href="{{path}}requests/{{request._id}}/details" target="_blank">Go to this Request</a> ({{path}}requests/{{request._id}}/details)</p>',
    subject: 'A service has been completed for {{request.no}}',
    variables: {
      path: 'https://portal.protranslating.com/',
      user: {
        firstName: 'Email',
        lastName: 'Receiver',
        email: 'email-receiver@protranslating.com',
      },
      finalDocuments: [{
        name: 'Document name',
        final: true,
      },
      {
        name: 'Other Document name',
        final: true,
      }],
      deliveringProvider: {
        firstName: 'Delivering',
        lastName: 'Provider',
      },
      request: {
        _id: 'request-id',
        no: 'request-#',
        contact: {
          firstName: 'John',
          lastName: 'Doe',
        },
        customer: {
          name: 'Customer',
        },
        otherContact: {
          firstName: 'Alice',
          lastName: 'Doe',
        },
        receptionDate: new Date(),
        title: 'New translation request',
        deliveryDate: new Date(),
        comments: 'Translation request comment',
        otherCC: 'another_email@lsp.com',
        status: 'Request status',
        srcLang: {
          name: 'English',
          isoCode: 'ENG',
        },
        tgtLangs: [{
          name: 'Spanish',
          isoCode: 'SPA',
        }],
        requireQuotation: false,
      },
    },
  },
};

const insertIfMissing = (schedulers, request) => schedulers.findOne({ name: request.name })
  .then((scheduler) => {
    if (!scheduler) {
      return schedulers.insert(request);
    }
    return schedulers.update({ name: request.name }, { $set: request });
  });

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const schedulers = db.collection('schedulers');
    return insertIfMissing(schedulers, requestCompletedEmail);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
