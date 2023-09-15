const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const requestingCustomizedQuoteEmail = {
  name: 'requesting-customizedquote-email',
  lspId: 'lsp ID',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'portal@big-ip.com',
    to: 'operations@big-ip.com',
    subject: 'A Customized Quote {{request.no}} has been requested',
    template: `
    <p><strong>Dear BIG IP Operations Team:</strong></p>
    <br/><br/>
    <p>An IP quote associated with a BIG IP request {{request.no}} has been created and is waiting for a customized quote to be attached.</p>
    <br/><br/>
    <a href="{{path}}requests/{{request._id}}/details" target="_blank">Go to the Request (IP Quote)</a>
    <br/>`,
    variables: {
      path: 'https://portal.protranslating.com/',
      request: {
        _id: 'request-id',
        no: 'request-no',
      },
    },
  },
};

const customizedQuoteCompletedEmail = {
  name: 'customizedquote-completed-email',
  lspId: 'lsp ID',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'notify@big-ip.com',
    to: '{{user.email}}',
    subject: 'Your Customized Quote {{request.no}} is ready for review',
    template: `
    <p><strong>Dear {{user.firstName}} {{user.lastName}}</strong></p>
    <br/><br/>
    <p>Your customized quote has been completed and it is ready for review. Please click on the link below to access your quote.</p>
    <br/><br/>
    <a href="{{path}}ip-quotes/{{request._id}}/details" target="_blank">Go to the Quote</a>
    <br/>`,
    variables: {
      path: 'https://portal.protranslating.com/',
      user: {
        email: 'test@test.com',
        firstName: 'John',
        lastName: 'Doe',
      },
      request: {
        _id: 'request-id',
        no: 'request-no',
      },
    },
  },
};

const insertOrUpdate = (schedulersCol, scheduler) =>
  schedulersCol.findOne({ name: scheduler.name })
    .then((dbScheduler) => {
      if (!dbScheduler) {
        return schedulersCol.insertOne(scheduler);
      }
      return schedulersCol.updateOne({ name: scheduler.name }, { $set: scheduler });
    });

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const schedulers = db.collection('schedulers');
    const lsp = db.collection('lsp');
    return lsp.findOne({ name: 'BIG IP' }).then(async ({ _id }) => {
      const requestingCQScheduler = Object.assign({}, requestingCustomizedQuoteEmail);
      const CQCompletedScheduler = Object.assign({}, customizedQuoteCompletedEmail);
      requestingCQScheduler.lspId = _id;
      CQCompletedScheduler.lspId = _id;
      await insertOrUpdate(schedulers, requestingCQScheduler);
      await insertOrUpdate(schedulers, CQCompletedScheduler);
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
