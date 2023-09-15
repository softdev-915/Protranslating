const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { renameExistingRoles } = require('../utils/migrations');

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
    Task Start Date: {{startDate}}<br>
    Task Delivery Date: {{dueDate}}<br>
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
      startDate: '09-12-2022 08:00',
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
    Task Start Date: {{startDate}}<br>
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
      startDate: '09-12-2022 08:00',
      dueDate: '09-13-2022 08:00',
    },
  },
  deleted: false,
};

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const schedulers = db.collection('schedulers');
  const collections = {
    users: db.collection('users'),
    groups: db.collection('groups'),
    roles: db.collection('roles'),
  };
  const lsp = db.collection('lsp');
  const pts = await lsp.findOne({ name: 'Protranslating' });
  await renameExistingRoles(
    { 'TASK-DASHBOARD-READ-ONLY': 'TASK-DASHBOARD_READ_OWN' }, collections);
  const updatedSchedulers = [providerOffersTaskNotification, providerOffersTaskUrgentNotification];
  return Promise.all(updatedSchedulers.map((s) => {
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
