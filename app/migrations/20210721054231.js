const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const requestingCustomizedQuoteEmail = {
  name: 'requesting-customized-quote-email',
  lspId: 'lsp ID',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'portal@big-ip.com',
    to: '{{user.email}}',
    subject: 'A Quote {{request.no}} has been requested',
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
  name: 'requesting-quote-email',
  lspId: 'lsp ID',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'notify@big-ip.com',
    to: '{{user.email}}',
    subject: 'Your Quote {{request.no}} is ready for review',
    template: `
    <p>
    Client Module: New Quote <br />
    A quote on your request has been made by {{lsp.name}} and is waiting for your review. <br />
    Attached please find a copy of the quote in PDF file format. <br />
    Request number: {{request.no}} <br />
    Request title: {{request.title}} <br />
    Turnaround time: {{request.turnaroundTime}} <br />
    <br />
    Go to Quote <a href="{{path}}requests/{{request._id}}/details/quote" target="_blank" rel="noopener noreferrer">here</a><br />
    </p>`,
    variables: {
      path: 'https://portal.protranslating.com/',
      user: {
        email: 'test@test.com',
        firstName: 'John',
        lastName: 'Doe',
      },
      documents: [
        { name: 'name 1' },
      ],
      request: {
        _id: 'request-id',
        no: 'request-no',
        title: 'title',
        turnaroundTime: 'turnaround-time',
        documents: ['name 1', 'name 2'],
      },
      lsp: {
        name: 'lsp-name',
      },
      emailCustom: {
        termsAndConditions: 'Terms and conditions',
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
