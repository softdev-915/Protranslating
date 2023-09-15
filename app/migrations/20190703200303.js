const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const serviceToDoProviderConsecutive = {
  name: 'service-to-do-provider-consecutive',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'vendorrelations@protranslating.com',
    template: '<p>ProTranslating</p><p>Office: 305-371-7887 ext. 445 / Fax: 305-371-8366</p><p>After Hours: 305-371-7887 ext.302</p><p><a href="mailto:vendorrelations@protranslating.com">vendorrelations@protranslating.com</a></p><p><a href="{{path}}tasks/{{request._id}}/{{task._id}}/details" target="_blank">Go to this Service</a></p><p>Dear Interpreter, please be sure to:</p><p><ul><li>ARRIVAL: Please arrive 20 - 30 MINUTES BEFORE SCHEDULED TIME</li><li>CHECK IN: Check in with your scheduling coordinator upon arrival via phone call, text or email</li><li>LATE: If you are running late please give at least ONE hour notice to our office - DO NOT call the client directly </li><li>INVOICE: Approve your bill using our Portal at portal.protranslating.com</li><li>TIME RESTRICTIONS: Please advise our office if you have any time restrictions for this setting as early as possible – DO NOT inform the end client directly of any time restrictions</li><li>SCHEDULING: You are specifically being hired for this setting, should you not be able to make it please let the scheduling coordinator know. </li><li>DRESS CODE: Business attire</li></ul></p><p>{{task.ability}}</p><p>Assignment #: {{request.no}}</p><p>Assignment Details</p><p>Name of Firm: {{request.company.name}}</p><p>Attorney: {{#if request.alsoDeliverTo}}{{username request.alsoDeliverTo}}{{else}}{{username request.contact}}{{/if}}</p><p>Assignment Date and Time: {{toTimezone request.expectedStartDate \'America/New_York\' \'YYYY-MM-DD hh:mm A z\'}}</p><p>Location: {{request.location.name}}</p><p>Scheduling Instructions: {{{request.internalComments}}}</p><p>Deponent: {{request.recipient}}</p><p>Case: {{request.title}}</p><p>Case/Claim No.: {{request.reference}}</p><p>Assignment Type: {{request.requestType.name}}</p><p>Language: {{task.languagePair}}</p><p>Special Instructions:</p><p>{{task.description}}</p>',
    subject: 'Service Summary: {{task.ability}} for {{toTimezone request.expectedStartDate \'America/New_York\' \'YYYY-MM-DD hh:mm A z\'}}',
    variables: {
      path: 'https://www.protranslating.com',
      user: {
        _id: '456',
        firstName: 'User',
        middleName: 'Middle',
        lastName: 'Receiver',
      },
      request: {
        no: 'ACME-1234-5',
        title: 'Request title',
        documentNames: 'files',
        comments: 'Request comment',
        internalComments: 'Request internal comment',
        company: {
          _id: '5313',
          name: 'Company name',
        },
        contact: {
          _id: '123',
          firstName: 'Contact',
          middleName: '1',
          lastName: 'User',
        },
        alsoDeliverTo: {
          _id: '123',
          firstName: 'Also',
          middleName: 'Deliver',
          lastName: 'To',
        },
        expectedStartDate: new Date(),
        reference: 'Request reference',
        location: {
          _id: '101112',
          name: 'Request location',
        },
        requestType: {
          _id: '9876',
          name: 'Request type',
        },
      },
      task: {
        _id: '678',
        ability: 'Ability',
        languagePair: 'English - Spanish',
        description: 'task description',
        providerTask: {
          provider: {
            _id: '123',
            firstName: 'Provider',
            middleName: '1',
            lastName: 'User',
          },
        },
      },
      enterprise: 'ProTranslating',
    },
  },
  deleted: false,
  createdBy: 'e2e@sample.com',
  executionHistory: [],
};

const serviceToDoProviderConference = {
  name: 'service-to-do-provider-conference',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'vendorrelations@protranslating.com',
    template: '<p><strong>Conference: {{task.ability}}</strong></p><p><strong>Request: {{request.no}}</strong></p><p><strong>Date: {{toTimezone request.expectedStartDate \'America/New_York\' \'YYYY-MM-DD hh:mm A z\'}}</strong></p><p><strong>Vendor: {{username task.providerTask.provider}}</strong></p><p><a href="{{path}}tasks/{{request._id}}/{{task._id}}/details" target="_blank">Go to this Service</a></p><p>Hello {{username user}},</p><p>Please find below information about the requested service for {{enterprise}}</p><p>Event Title: {{request.title}}</p><p>Event Location: {{request.location.name}}</p><p>Event Schedule: {{{request.comments}}}</p><p>Service Name: {{task.ability}}</p><p>Language pair(s): {{task.languagePair}}</p><p>Special Instructions:</p><p>{{task.description}}</p><p>Disclaimer: {{{request.internalComments}}}</p><p>Payments and Cancellations</p><p>Payments will be processed within 30 days of receipt of invoice. Please note that checks will be issued on Fridays. If the event is cancelled within 7 days of the start of the event, ProTranslating will honor a cancellation fee equal to the amount contracted, unless otherwise specified in the disclaimer notes above.</p><p>Please approve your bill using our Portal at portal.protranslating.com</p><p>General Guidelines</p><p><ul><li>Punctuality: Please be in the conference room at least half hour prior to event start time.</li><li>Dress Code: Business attire (i.e. slacks and jacket for men, skirts/slacks and jacket for ladies, conservative colors, no revealing attire).</li><li>Meals: All Meals and refreshments at your own expense, unless otherwise noted.</li></ul></p><p>General Conditions</p><p>Anything disclosed or learned in the course of service shall be kept confidential and shall neither be used nor be revealed to outside parties without the permission of ProTranslating, or unless otherwise legally required. The interpreter agrees not to discuss the fees or any other terms and conditions of assignment with other interpreter(s). It is also understood that the client and the interpreter shall not arrange additional assignments nor discuss fees or any other arrangements and that the interpreter may not contact the client directly for a period of two (2) years. The exchange of business cards between interpreters and clients is considered a direct-marketing effort and a breach of contract.</p><p>Liability</p><p>The interpreter shall exercise his/her best efforts to assure the event runs as smoothly as possible. Should s/he become unavailable to serve as indicated, the interpreter accepts the responsibility to exert best efforts to find a qualified substitute on the same terms, with the approval of ProTranslating. The interpreter may not be liable for circumstances beyond his/her control, including illness, family emergencies, disruption of transportation or natural disaster.</p><p>Force Majeure</p><p>The performance of this Agreement is subject to termination without liability for either party upon the occurrence of any circumstance beyond the control of either party such as acts of God, war, terrorism, government regulations, disaster, epidemic, pandemic or the issuance of a restriction order by any authority that impedes to celebrate the convention due to health concerns, strikes (except those involving the employees or agents of the party seeking the protection of this clause), civil disorder, or curtailment of transportation facilities to the extent that such circumstance makes it illegal or impossible to provide or use the venue’s facilities. The ability to terminate this agreement without liability pursuant to this paragraph is conditioned upon delivery of written notice to the other party setting forth the basis for such termination as soon as reasonably practical but in no event longer than (10) days after learning of such basis.</p>',
    subject: 'Service Summary: {{task.ability}} for {{toTimezone request.expectedStartDate \'America/New_York\' \'YYYY-MM-DD hh:mm A z\'}}',
    variables: {
      path: 'https://www.protranslating.com',
      user: {
        _id: '456',
        firstName: 'User',
        middleName: 'Middle',
        lastName: 'Receiver',
      },
      request: {
        no: 'ACME-1234-5',
        title: 'Request title',
        documentNames: 'files',
        comments: 'Request comment',
        internalComments: 'Request internal comment',
        company: {
          _id: '5313',
          name: 'Company name',
        },
        expectedStartDate: new Date(),
        reference: 'Request reference',
        location: {
          _id: '101112',
          name: 'Request location',
        },
        requestType: {
          _id: '9876',
          name: 'Request type',
        },
      },
      task: {
        _id: '678',
        ability: 'Ability',
        languagePair: 'English - Spanish',
        description: 'task.description',
        providerTask: {
          provider: {
            _id: '123',
            firstName: 'Provider',
            middleName: '1',
            lastName: 'User',
          },
        },
      },
      enterprise: 'ProTranslating',
    },
  },
  deleted: false,
  createdBy: 'e2e@sample.com',
  executionHistory: [],
};

const serviceToDoProviderNotification = {
  name: 'service-to-do-provider-notification',
  email: {
    from: 'conference@protranslating.com',
    template: '<p><strong>Conference: {{task.ability}}</strong></p><p><strong>Request: {{request.no}}</strong></p><p><strong>Date: {{toTimezone request.expectedStartDate \'America/New_York\' \'YYYY-MM-DD hh:mm A z\'}}</strong></p><p><strong>Vendor: {{username task.providerTask.provider}}</strong></p><p><a href="{{path}}tasks/{{request._id}}/{{task._id}}/details" target="_blank">Go to this Service</a></p><p>Hello {{username user}},</p><p>Please find below information about the requested service for {{enterprise}}</p><p>Event Title: {{request.title}}</p><p>Event Location: {{request.location.name}}</p><p>Event Schedule: {{{request.comments}}}</p><p>Service Name: {{task.ability}}</p><p>Language pair(s): {{task.languagePair}}</p><p>Special Instructions:</p><p>{{task.description}}</p><p>Disclaimer: {{{request.internalComments}}}</p><p>Payments and Cancellations</p><p>Payments will be processed within 30 days of receipt of invoice. Please note that checks will be issued on Fridays. If the event is cancelled within 7 days of the start of the event, ProTranslating will honor a cancellation fee equal to the amount contracted, unless otherwise specified in the disclaimer notes above.</p><p>Please approve your bill using our Portal at portal.protranslating.com</p><p>General Guidelines</p><p><ul><li>Punctuality: Please be in the conference room at least half hour prior to event start time.</li><li>Dress Code: Business attire (i.e. slacks and jacket for men, skirts/slacks and jacket for ladies, conservative colors, no revealing attire).</li><li>Meals: All Meals and refreshments at your own expense, unless otherwise noted.</li></ul></p><p>General Conditions</p><p>Anything disclosed or learned in the course of service shall be kept confidential and shall neither be used nor be revealed to outside parties without the permission of ProTranslating, or unless otherwise legally required. The interpreter agrees not to discuss the fees or any other terms and conditions of assignment with other interpreter(s). It is also understood that the client and the interpreter shall not arrange additional assignments nor discuss fees or any other arrangements and that the interpreter may not contact the client directly for a period of two (2) years. The exchange of business cards between interpreters and clients is considered a direct-marketing effort and a breach of contract.</p><p>Liability</p><p>The interpreter shall exercise his/her best efforts to assure the event runs as smoothly as possible. Should s/he become unavailable to serve as indicated, the interpreter accepts the responsibility to exert best efforts to find a qualified substitute on the same terms, with the approval of ProTranslating. The interpreter may not be liable for circumstances beyond his/her control, including illness, family emergencies, disruption of transportation or natural disaster.</p><p>Force Majeure</p><p>The performance of this Agreement is subject to termination without liability for either party upon the occurrence of any circumstance beyond the control of either party such as acts of God, war, terrorism, government regulations, disaster, epidemic, pandemic or the issuance of a restriction order by any authority that impedes to celebrate the convention due to health concerns, strikes (except those involving the employees or agents of the party seeking the protection of this clause), civil disorder, or curtailment of transportation facilities to the extent that such circumstance makes it illegal or impossible to provide or use the venue’s facilities. The ability to terminate this agreement without liability pursuant to this paragraph is conditioned upon delivery of written notice to the other party setting forth the basis for such termination as soon as reasonably practical but in no event longer than (10) days after learning of such basis.</p>',
    subject: 'Conference: {{task.ability}} {{request.no}}',
    variables: {
      path: 'https://www.protranslating.com',
      user: {
        _id: '456',
        firstName: 'User',
        middleName: 'Middle',
        lastName: 'Receiver',
      },
      request: {
        no: 'ACME-1234-5',
        title: 'Request title',
        documentNames: 'files',
        comments: 'Request comment',
        internalComments: 'Request internal comment',
        company: {
          _id: '5313',
          name: 'Company name',
        },
        expectedStartDate: new Date(),
        reference: 'Request reference',
        location: {
          _id: '101112',
          name: 'Request location',
        },
        requestType: {
          _id: '9876',
          name: 'Request type',
        },
      },
      task: {
        _id: '678',
        ability: 'Ability',
        languagePair: 'English - Spanish',
        description: 'task.description',
        providerTask: {
          provider: {
            _id: '123',
            firstName: 'Provider',
            middleName: '1',
            lastName: 'User',
          },
        },
      },
      enterprise: 'ProTranslating',
    },
  },
  deleted: false,
};

const insertIfMissing = (schedulers, lsp, schedulerData) => schedulers.findOne({
  name: schedulerData.name,
  lspId: lsp._id,
}).then((scheduler) => {
  schedulerData.lspId = lsp._id;
  if (!scheduler) {
    return schedulers.insert(schedulerData);
  }
  return schedulers.updateOne({ _id: scheduler._id }, { $set: schedulerData });
});

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const schedulers = db.collection('schedulers');
    const lsp = db.collection('lsp');
    const schedulerPromises = [];
    return lsp.find({ $or: [{ name: 'Protranslating' }, { name: 'PTI' }] }).toArray()
      .then((lsps) => {
        lsps.forEach((l) => {
          schedulerPromises.push(() =>
            insertIfMissing(schedulers, l, serviceToDoProviderNotification));
          if (l.name === 'PTI') {
            schedulerPromises.push(() =>
              insertIfMissing(schedulers, l, serviceToDoProviderConsecutive));
            schedulerPromises.push(() =>
              insertIfMissing(schedulers, l, serviceToDoProviderConference));
          }
        });
        return Promise.mapSeries(schedulerPromises, promise => promise());
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
