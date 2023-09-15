const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const quoteClientApprovedPmEmail = {
  name: 'quote-client-approved-pm-email',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'support@protranslating.com',
    template: `
    <p>Hello {{user.PMName}}, </p>
    <strong><ins>Quote approved.</ins></strong><br><br>
    A quote associated to a request for Professional Translating Services has been approved.<br>
    <p style="text-indent: 1em;">Request Number:  {{quote.requestNo}} </p>
    <p style="text-indent: 1em;">Customer:  {{quote.customerName}} </p>
    <p style="text-indent: 1em;">Approved by:  {{quote.approvedBy}} </p>
    <p style="text-indent: 1em;">Quote Number:  {{quote.quoteNum}} </p>
    <a href="{{path}}list-quote/{{quote.quoteNum}}">Go to the request</a><br>
    `,
    subject: 'Quote {{quote.quoteNum}} has been approved by client',
    variables: {
      path: 'https://portal.protranslating.com/',
      user: {
        // preparedby
        PMName: 'John Doe',
        email: 'email-receiver@protranslating.com',
      },
      quote: {
        // Request Number
        requestNo: 'ACME-1234-5',
        // Requested By
        customerName: 'Mike Tod',
        // User approving
        approvedBy: 'User Name',
        // Quote Number
        quoteNum: 'Q1234',
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
    return insertIfMissing(schedulers, quoteClientApprovedPmEmail);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
