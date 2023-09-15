const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const template = `<div id="newBillTemplate">
  <div id="page-header">
      <div id="page-header-bar"></div>
      <div id="header">
          <div>
              {{#if bill.templateLogo}} 
                  <img src="{{bill.templateLogo}}" alt="{{bill.templateLogoName}}" /> 
              {{/if}}
          </div>
          <div class="header-info">
              <h4>Bill</h4>
              <span># {{bill.no}}</span>
          </div>
      </div>
  </div>
  <div class="bill-address-container">
      <div class="bill-address">
          <div class="bill-title">Vendor Details</div>
          <div>
              <div class="bill-company text-bold">{{bill.vendor.name}}</div>
              <div class="pb-0">{{bill.vendor.vendorDetails.address.line1}} {{bill.vendor.vendorDetails.address.line2}}</div>
              <div>{{bill.vendor.vendorDetails.address.city}}, {{bill.vendor.vendorDetails.address.state.name}} {{bill.vendor.vendorDetails.address.zip}}, {{ bill.vendor.vendorDetails.address.country.name }}</div>
              {{#if bill.vendor.email }}
                  <div>{{ bill.vendor.email }}</div>
              {{/if}}
              {{#if bill.vendor.vendorDetails.phoneNumber }} 
                  <div>{{ bill.vendor.vendorDetails.phoneNumber }}</div>
              {{/if}}
          </div>
          <div>
              <div>
                  <span class="bill-title">Date:</span> {{formatDate bill.date 'MMM DD, YYYY'}}
              </div>
              <div>
                  <span class="bill-title">Due Date:</span> {{formatDate bill.dueDate 'MMM DD, YYYY'}}
              </div>
              <div>
                  <span class="bill-title">Terms:</span> {{bill.vendor.vendorDetails.billingInformation.billingTerms.name}}
              </div>
          </div>
      </div>
      <div class="bill-address">
          <div class="bill-title pb-0">Bill To</div>
          <div class="pb-0">
              <div class="bill-company text-bold pb-0">{{bill.lsp.name}}</div>
          </div>
      </div>
  </div>
  <div id="bill-details">
      {{#if bill.vendor.vendorDetails.billingInformation.paymentMethod.name}}
          <div class="bill-detail-item">
              <div class="bill-title">Payment Method</div>
              <div>{{bill.vendor.vendorDetails.billingInformation.paymentMethod.name}}</div>
          </div>
      {{/if}}
      {{#if bill.status}}
          <div class="bill-detail-item">
              <div class="bill-title">Bill Status</div>
              <div>{{bill.status}}</div>
          </div>
      {{/if}}
  </div>
  <table class="bill-table">
      <thead>
          <tr>
              <th colspan="3">TASK&nbsp;DESCRIPTION</th>
              <th class="text-right">RECIPIENT</th>
              <th class="text-right pr-0">REFERENCE&nbsp;NO.</th>
              <th class="text-right">TASK&nbsp;AMOUNT</th>
          </tr>
      </thead>
      <tbody>
          <div>
              {{#each bill.serviceDetails as |entry|}}
                <tr>
                    <td colspan="3">
                        <div class="blacken">{{entry.taskDescription}}</div>
                    </td>
                    <td class="text-right">{{entry.recipient}}</td>
                    <td class="text-right pr-0">{{entry.referenceNumber}}</td>
                    <td class="text-right">\${{toFixed entry.taskAmount 2 true}}</td>
                </tr>
              {{/each}}
          </div>
          <tr>
              <td class="no-border total pb-0" colspan="3"></td>
              <td colspan="2" class="no-border total blacken pb-0">TOTAL</td>
              <td class="no-border total blacken pb-0">USD&nbsp;{{toFixed bill.totalAmount 2}}</td>
          </tr>
          <tr>
              <td colspan="3" class="no-border pb-0"></td>
              <td colspan="2" class="no-border blacken pb-0" >Amount Paid</td>
              <td class="no-border pb-0">USD&nbsp;{{toFixed bill.amountPaid 2}}</td>
          </tr>
          <tr>
              <td colspan="3" class="no-border pb-0"></td>
              <td class="no-border blacken pb-0" colspan="2">Amount Remaining</td>
              <td class="no-border pb-0">USD&nbsp;{{toFixed bill.balance 2}}</td>
          </tr>
      </tbody>
  </table>
  <div class="payment-details">
      <h4 class="payment-details-title">PAYMENT DETAILS</h4>
      <span><span class="bolder">BLS TAX ID:</span> 59-1567380</span>
      <div class="payment-details-container">
          <div class="payment-details-item">
              <h4>Payment Inquiries</h4>
              <span>AP@biglanguage.com</span>
          </div>
      </div>
  </div>
</div>`;

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const templatesCol = db.collection('templates');
    return templatesCol.updateMany({ name: 'monthly-bill-template' }, {
      $set: {
        template,
      },
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
