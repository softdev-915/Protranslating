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
    <p><span style="font-size:13.3333px;white-space:pre-wrap;"><i><b>Hello,</b> {{user.firstName}} {{user.lastName}},</i></span></p>
    <p><span style="font-size:13.3333px;white-space:pre-wrap;"><i><b>Portal Module:</b> Bill Paid</i></span></p>
    <p><span style="font-size:13.3333px;white-space:pre-wrap;"><i><b>A bill for your task has been paid by</b> {{lsp.name}}.</i></span></p>
    <p><span style="font-size:13.3333px;white-space:pre-wrap;"><i><b>Payment ID:</b> {{apPaymentId}}</i></span></p>
    <p><span style="font-size:13.3333px;white-space:pre-wrap;"><i><b>Details: </b></i></span></p>
    <div class="table" style="display:table;width:500px;border:1px solid;">
    <div class="tr" style="display:table-row;">
        <div class="th" style="text-align:center;display:table-cell;border:1px solid;">Bill Number</div>
        <div class="th" style="text-align:center;display:table-cell;border:1px solid;">Payment amount</div>
    </div>
    {{#each billDetails as |entry|}}
    <div class="tr" style="display:table-row;">
      <div class="td" style="text-align:center;display:table-cell;border:1px solid;"><b>{{entry.no}}</b></div>
      <div class="td" style="text-align:center;display:table-cell;border:1px solid;"><b>{{entry.amountPaidFormatted}}</b></div>
    </div>
    {{/each}}
  </div>
  <p><span><i><span style="background-color:transparent;font-variant-numeric:normal;font-variant-east-asian:normal;vertical-align:baseline;font-size:13.3333px;white-space:pre-wrap;"></span></i></span></p>
    <p><span style="font-size:13.3333px;white-space:pre-wrap;"><i><b>Total Amount Paid: </b>{{toFixed totalAmountPaid 2}}</i></span></p>
    <a href="{{path}}/ap-payment/{{apPaymentId}}/details" target="_blank" rel="noopener noreferrer">Go to the Bill Payment</a><br>
    `,
    subject: 'Payment Sent',
    variables: {
      lsp: {
        name: '',
      },
      path: 'https://www.protranslating.com',
      apPaymentId: '61fc61e2cd7cc500165ca1b0',
      totalAmountPaid: 15,
      user: {
        email: 'johndoe@sample.com',
        firstName: 'John',
        lastName: 'Doe',
      },
      billDetails: [
        {
          no: 'PTSBA220214 370015',
          amountPaidFormatted: 5,
        },
        {
          no: 'PTSB220203 700',
          amountPaidFormatted: 10,
        },
      ],
    },
  },
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const schedulersCol = db.collection('schedulers');
    return lspCol.find({}).toArray().then(lsps => Promise.mapSeries(lsps, (lsp) => {
      scheduler.lspId = lsp._id;
      return schedulersCol.findOne({ name: scheduler.name, lspId: lsp._id })
        .then((schedulerInDb) => {
          if (!_.isNil(schedulerInDb)) {
            return schedulersCol.updateOne(
              { _id: schedulerInDb._id },
              { $set: { email: scheduler.email },
              });
          }
        });
    }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
