const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const requestProjectManagerEmail = {
  name: 'request-creation-pm-email',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'support@protranslating.com',
    template: '<p><strong>Customer Name:</strong> {{request.customer.name}}</p><p><strong>Requested By:</strong> {{username request.contact}}</p><p><strong>Request Number:</strong> {{request.no}}</p><p><strong>Document(s) Name:</strong> {{#each documents}}{{name}},{{/each}}</p><p><strong>Reference Document(s) Name:</strong> {{#each referenceDocuments}}{{name}},{{/each}}</p><p><strong>Requested Delivery Date:</strong> {{toTimezone request.deliveryDate \'America/New_York\' \'YYYY-MM-DD hh:mm A z\'}}</p><p><a href="{{path}}requests/{{request._id}}/details" target="_blank">Go to this Request</a></p>',
    subject: 'A customer has added a request for {{request.customer.name}} using the client module.',
    variables: {
      path: 'https://portal.protranslating.com/',
      user: {
        firstName: 'Email',
        lastName: 'Receiver',
        email: 'email-receiver@protranslating.com',
      },
      documents: [{
        name: 'Document name',
      }],
      referenceDocuments: [{
        name: 'Reference document name',
      }],
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

const requestModifiedProjectManagerEmail = {
  name: 'request-modified-pm-email',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'support@protranslating.com',
    template: '<p>Hello {{username user}}, </p><p>Modified Request</p><p>A request has been modified. Please kindly note the changes which have been made as they may concern you.</p><p>Customer Name: {{request.customer.name}}<p>Requested By: {{username request.contact}}</p><p>Request Number: {{request.no}}</p><p>Modifications: <table><thead><tr> <th>Element(s)</th> <th>Old Value</th> <th>New Value</th></tr></thead><tbody>{{#each modifications}}<tr><td>{{name}}</td><td>{{oldValue}}</td><td>{{value}}</td></tr>{{/each}}</tbody></p><p>Delivery Date:{{toTimezone request.deliveryDate \'America/New_York\' \'YYYY-MM-DD hh:mm A z\'}}</p><p><a href="{{path}}requests/{{request._id}}/details">Go to this Request</a></p>',
    subject: 'The request {{request.title}} has been modified',
    variables: {
      path: 'https://portal.protranslating.com/',
      modifications: [{
        name: 'title',
        oldValue: 'Old title',
        newValue: 'New Value',
      }],
      user: {
        firstName: 'Email',
        lastName: 'Receiver',
        email: 'email-receiver@protranslating.com',
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
        documents: [{
          name: 'Document\'s name',
          isReference: false,
        }],
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

const serviceToDoScheduler = {
  name: 'service-to-do-staff-vendor-email',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'notify@protranslating.com',
    template: `
    <h1>Service To Do </h1>
    <strong><ins>You have a service to do for {{enterprise}}</ins></strong><br><br>
    <p style="text-indent: 1em;">Request Number:  {{request.no}} </p>
    <p style="text-indent: 1em;">Document Name:  {{request.documentNames}} </p>
    <p style="text-indent: 1em;">{{task.units}}</p>
    <p style="text-indent: 1em;">Service Name:  {{task.ability}} </p>
    <p style="text-indent: 1em;">Language pair(s):  {{task.languagePair}} </p>
    <p style="text-indent: 1em;">Delivery date:  {{toTimezone task.deliveryDate 'America/New_York' 'YYYY-MM-DD hh:mm A z'}} </p>
    <a href="{{path}}">Go to the service</a><br>
    `,
    subject: 'Service Summary: {{request.no}}',
    variables: {
      path: 'https://www.protranslating.com',
      request: {
        no: 'ACME-1234-5',
        documentNames: 'files',
      },
      task: {
        units: '10 Reps',
        ability: 'Ability',
        languagePair: 'English - Spanish',
        deliveryDate: '2017-07-31 19:00',
      },
      enterprise: 'ProTranslating',
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
    return insertIfMissing(schedulers, requestProjectManagerEmail)
      .then(() => insertIfMissing(schedulers, serviceToDoScheduler))
      .then(() => insertIfMissing(schedulers, requestModifiedProjectManagerEmail));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
