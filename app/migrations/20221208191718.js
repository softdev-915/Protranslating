const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { addNewRole } = require('../utils/migrations');

const providerPoolingOfferScheduler = {
  name: 'provider-pooling-offer',
  every: '30 seconds',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
};

const providerOfferClosedTaskNotification = {
  name: 'provider-offers-closed-tasks-notification',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'notify@protranslating.com',
    to: '{{user.email}}',
    subject: '{{reqNumber}} - Closed Provider Task Offer - {{ability}}',
    template: `
    <p>Thank you for your consideration. This offer is now closed.</p><br>
    Language: {{languageCombination}}<br>
    Request No: {{reqNumber}}<br>
    Task: {{ability}}<br>`,
    variables: {
      user: {
        email: 'test@test.com',
      },
      reqNumber: 'R220912-146',
      ability: 'Translation',
      languageCombination: 'English - Spanish',
    },
  },
  deleted: false,
};

const providerOffersAcceptedNotification = {
  name: 'provider-offers-accepted-tasks-notification',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'notify@protranslating.com',
    to: '{{user.email}}',
    subject: '{{reqNumber}} - {{ability}} - {{languageCombination}} - ACCEPTED',
    template: `
    <p>The following task has been accepted.</p><br>
    Provider: {{provider}}<br>
    Language: {{languageCombination}}<br>
    Request No: {{reqNumber}}<br>
    No. of Files for Translation: {{filesAmount}}<br>
    Task: {{ability}}<br>
    Quantity: {{quantity}}<br>
    Delivery Date: {{dueDate}}<br>
    Go to the <a href="{{path}}">Service</a> to log into your registered account.<br>`,
    variables: {
      path: 'https://portal.protranslating.com/',
      user: {
        email: 'test@test.com',
      },
      provider: 'Jon Snow',
      reqNumber: 'R220912-146',
      ability: 'Translation',
      languageCombination: 'English - Spanish',
      filesAmount: 1,
      quantity: 10,
      dueDate: '09-13-2022 08:00',
    },
  },
  deleted: false,
};

const providerOffersExpiredNotification = {
  name: 'provider-offers-expired-tasks-notification',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'notify@protranslating.com',
    to: '{{user.email}}',
    subject: '{{reqNumber}} - All rounds of offers have been completed. - {{ability}}',
    template: `
    <p>All rounds of offers have been completed.</p><br>
    Language: {{languageCombination}}<br>
    Request No: {{reqNumber}}<br>
    No. of Files for Translation: {{filesAmount}}<br>
    Task: {{ability}}<br>
    Quantity: {{quantity}}<br>
    Delivery Date: {{dueDate}}<br>
    Go to the <a href="{{path}}">Service</a> to log into your registered account.<br>`,
    variables: {
      path: 'https://portal.protranslating.com/',
      user: {
        email: 'test@test.com',
      },
      reqNumber: 'R220912-146',
      ability: 'Translation',
      languageCombination: 'English - Spanish',
      filesAmount: 1,
      quantity: 10,
      dueDate: '09-13-2022 08:00',
    },
  },
  deleted: false,
};

const providerOffersTaskNotification = {
  name: 'provider-offers-tasks-notification',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'notify@protranslating.com',
    to: '{{user.email}}',
    subject: '{{reqNumber}} - Pending Provider Task Offer - {{ability}}',
    template: `
    <p>NOTE: This offer has been sent to multiple providers. Receiving this email does not imply the Task has been assigned to you.</p><br>
    Language: {{languageCombination}}<br>
    Request No: {{reqNumber}}<br>
    No. of Files for Translation: {{filesAmount}}<br>
    Task: {{ability}}<br>
    Quantity: {{quantity}}<br>
    Project Manager(s): {{pm}}<br>
    Delivery Date: {{dueDate}}<br>
    Go to the <a href="{{path}}">Service</a> to log into your registered account.<br>`,
    variables: {
      path: 'https://portal.protranslating.com/',
      user: {
        email: 'test@test.com',
      },
      reqNumber: 'R220912-146',
      ability: 'Translation',
      languageCombination: 'English - Spanish',
      filesAmount: 1,
      quantity: 10,
      pm: 'John Doe',
      dueDate: '09-13-2022 08:00',
    },
  },
  deleted: false,
};

const providerOffersTaskUrgentNotification = {
  name: 'provider-offers-tasks-urgent-notification',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'notify@protranslating.com',
    to: '{{user.email}}',
    subject: '{{reqNumber}} - URGENT Pending Provider Task Offer - {{ability}}',
    template: `
    <p>NOTE: This offer has been sent to multiple providers. Receiving this email does not imply the Task has been assigned to you.</p><br>
    Language: {{languageCombination}}<br>
    Request No: {{reqNumber}}<br>
    No. of Files for Translation: {{filesAmount}}<br>
    Task: {{ability}}<br>
    Quantity: {{quantity}}<br>
    Project Manager(s): {{pm}}<br>
    Delivery Date: {{dueDate}}<br>
    Go to the <a href="{{path}}">Service</a> to log into your registered account.<br>`,
    variables: {
      path: 'https://portal.protranslating.com/',
      user: {
        email: 'test@test.com',
      },
      reqNumber: 'R220912-146',
      ability: 'Translation',
      languageCombination: 'English - Spanish',
      filesAmount: 1,
      quantity: 10,
      pm: 'John Doe',
      dueDate: '09-13-2022 08:00',
    },
  },
  deleted: false,
};

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const users = db.collection('users');
  const groups = db.collection('groups');
  const roles = db.collection('roles');
  const schedulers = db.collection('schedulers');
  const lsp = db.collection('lsp');
  const pts = await lsp.findOne({ name: 'Protranslating' });
  if (_.isNil(pts)) {
    return Promise.resolve();
  }
  const newRoles = ['TASK-DASHBOARD-READ-ONLY', 'OFFER_READ_ALL', 'OFFER_CREATE_ALL', 'OFFER_UPDATE_ALL'];
  const collections = {
    users,
    groups,
    roles,
  };
  await addNewRole(newRoles, ['LSP_ADMIN'], collections);

  const newSchedulers = [
    providerPoolingOfferScheduler,
    providerOfferClosedTaskNotification,
    providerOffersAcceptedNotification,
    providerOffersExpiredNotification,
    providerOffersTaskNotification,
    providerOffersTaskUrgentNotification,
  ];
  return Promise.all(newSchedulers.map((s) => {
    s.lspId = pts._id;
    return schedulers.updateOne({ name: s.name, lspId: s.lspId }, { $set: s }, { upsert: true });
  }),
  );
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
