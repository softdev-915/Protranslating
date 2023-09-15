const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const scheduler = {
  name: 'bill-paid-provider',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'notify@protranslating.com',
    template: `
      <p><span id="docs-internal-guid-d21fd00f-7fff-d913-d85e-0863f89dfad7"><span style="font-size: 10pt; font-family: Calibri, sans-serif; background-color: transparent; font-weight: 700; font-style: italic; font-variant-numeric: normal; font-variant-east-asian: normal; vertical-align: baseline; white-space: pre-wrap;">From: </span><span style="text-decoration: none; font-size: 10pt; font-family: Calibri, sans-serif; background-color: transparent; font-weight: 700; font-style: italic; font-variant-numeric: normal; font-variant-east-asian: normal; vertical-align: baseline; white-space: pre-wrap;"><a href="mailto:notify@protranslating.com" style="text-decoration:none;">notify@protranslating.com</a></span></span></p>
      <p><font face="Calibri, sans-serif"><span style="font-size: 13.3333px; white-space: pre-wrap;"><i style=""><b>To:</b> {{user.email}}</i></span></font></p>
      <p><font face="Calibri, sans-serif"><span style="font-size: 13.3333px; white-space: pre-wrap;"><i><b>Subject:</b> Payment Sent</i></span></font></p>
      <p><font face="Calibri, sans-serif"><span style="font-size: 13.3333px; white-space: pre-wrap;"><i><b>Hello,</b> {{ user.firstName }} {{ user.lastName }},</i></span></font></p>
      <p><font face="Calibri, sans-serif"><span style="font-size: 13.3333px; white-space: pre-wrap;"><i><b>Portal Module:</b> Bill Paid</i></span></font></p>
      <p><font face="Calibri, sans-serif"><span style="font-size: 13.3333px; white-space: pre-wrap;"><i><b>A bill for your task has been paid by</b> {{ lsp.name }}.</i></span></font></p>
      <p><font face="Calibri, sans-serif"><span style="font-size: 13.3333px; white-space: pre-wrap;"><i><b>Request Number:</b> {{requestNo}}</i></span></font></p>
      <p><font face="Calibri, sans-serif"><span style="font-size: 13.3333px; white-space: pre-wrap;"><i><b>Bill Number:</b> {{billNo}}</i></span></font></p>
      <p><span id="docs-internal-guid-d21fd00f-7fff-d913-d85e-0863f89dfad7"><font face="Calibri, sans-serif"><i><span style="background-color: transparent; font-variant-numeric: normal; font-variant-east-asian: normal; vertical-align: baseline; font-size: 13.3333px; white-space: pre-wrap;"></span></i></font></span></p>
      <p><font face="Calibri, sans-serif" style=""><span style="font-size: 13.3333px; white-space: pre-wrap;"><i><b>Amount Paid: </b></i></span></font><font face="Calibri, sans-serif" style=""><span style="font-size: 13.3333px; white-space: pre-wrap;"><i style="">{{ amountPaid }}</i></span></font></p>
      <a href="{{path}}bill/{{billId}}/details" target="_blank">Go to Bill</a><br>
    `,
    subject: 'Payment Sent',
    variables: {
      path: 'https://www.protranslating.com',
      requestNo: 'ACME-1234-5',
      billNo: 'B1234',
      billId: '1234',
      amountPaid: 0,
      user: {
        email: 'johndoe@sample.com',
        firstName: 'John',
        lastName: 'Doe',
      },
    },
  },
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const schedulersCol = db.collection('schedulers');
    return lspCol.find({})
      .toArray().then(lsps =>
        Promise.mapSeries(lsps, (lsp) => {
          scheduler.lspId = lsp._id;
          return schedulersCol.findOne({ name: scheduler.name, lspId: lsp._id })
            .then((schedulerInDb) => {
              if (_.isNil(schedulerInDb)) {
                return schedulersCol.insertOne(scheduler);
              }
              return schedulersCol.updateOne({ name: scheduler.name, lspId: lsp._id }, {
                $set: {
                  email: scheduler.email,
                },
              });
            });
        }),
      );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
