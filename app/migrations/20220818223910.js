const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const template = {
  name: 'monthly-bill-template',
  type: 'Bill',
  template: `<div class="container m-3" id="billTemplate">
  <div class="row align-items-center">
     <div class="col-6 p-0 lsp-info">
        <span class="middle-size-header">{{ bill.lsp.name }}</span><br>
        {{ bill.lsp.addressInformation.line1 }}, {{ bill.lsp.addressInformation.line2 }}<br>
        {{ bill.lsp.addressInformation.city }}, {{ bill.lsp.addressInformation.state.name }}<br>{{ bill.lsp.addressInformation.zip }},&nbsp;<br>{{ bill.lsp.addressInformation.country.name }}<br>Phone: {{ bill.lsp.phoneNumber }}<br>
        <a href="{{bill.lsp.url}}" rel="noopener noreferrer">{{ bill.lsp.url }}</a><br>
        <span class="small">Tax ID: {{ bill.lsp.taxId }}</span>
     </div>
     <div class="col-6 text-right lsp-logo"><img src="{{ bill.lsp.logoImage}}"></div>
  </div>
  <div class="row mt-4">
     <div class="col-8 p-0"><span class="local-header">Vendor Details:</span><br>{{ bill.vendor.firstName }} {{ bill.vendor.lastName }}<br>email: {{ bill.vendor.email }}</div><div class="col-8 p-0">phone: {{ bill.vendor.vendorDetails.phoneNumber }}<br>{{ bill.vendor.vendorDetails.address.line1 }} {{ bill.vendor.vendorDetails.address.line2 }} <br>{{ bill.vendor.vendorDetails.address.city}}, {{ bill.vendor.vendorDetails.address.state.name}}, {{bill.vendor.vendorDetails.address.zip}}<br>{{ bill.vendor.vendorDetails.address.country.name }}
     </div>
     <div class="col-4 text-right"><span class="big-size-header">Bill<br>
        #{{bill.no}}<br></span> {{bill.date}}
     </div>
  </div>
  <div class="row">
     <div class="col-4 offset-8 bill-total-box blue-light-bg billToDate text-right">
        <p class="local-header middle-size-header mb-0">TOTAL</p>
        <p class="middle-size-header d-inline">{{ bill.currency.isoCode }}</p><p class="big-size-header d-inline ml-1">{{bill.totalAmount }}</p>
        <p><span class="local-header">Bill Due Date:</span> {{bill.dueDate}}</p>
     </div>
  </div>
<div class="row">
     <div class="col-12 p-0">
   <hr class="horizontal-line">
       <table class="table">
         <thead class="blue-light-bg local-header">
           <tr>
             <th>Vendor Company</th>
             <th>Payment Method</th>
             
             <th>Billing terms</th><td><span style="font-weight:700;">Bill Status</span><br></td>
             
           </tr>
         </thead>
         <tbody>
           <tr>
             <td style="word-break:break-all;">{{bill.vendorCompany}}</td>
             <td>{{bill.paymentMethod.name}}</td>
             
             <td>{{bill.billingTerms.name}}</td><td>{{bill.status}}<br></td>
             
           </tr>
         </tbody>
       </table>
     </div>
   </div>
   <div class="row">
     <div class="col-12 p-0">
       <div class="divTable auto-width-table">
         <div class="divTableBody">
           <div class="divTableHeader blue-light-bg local-header divTableRow">
             <div class="divTableCell">Task Amount</div>
             <div class="divTableCell">Task Description
             </div>
             <div class="divTableCell">Recipient<br></div>
             <div class="divTableCell">
               Reference No.</div>
             <div class="divTableCell text-right"><br></div>
           </div>
         </div>
         <div class="divTableBody">
           {{#each bill.serviceDetails as |entry|}}
           <div class="divTableRow"><div class="divTableCell">{{toFixed entry.taskAmount 2}}<br>
               </div><div class="divTableCell">{{entry.taskDescription}}
             </div>
             <div class="divTableCell">
               <b>{{ entry.recipient }}</b>
             </div>
             <div class="divTableCell">
               {{entry.referenceNumber}}
             </div>
             <div class="divTableCell text-right"><br></div>
           </div>{{/each}}
         </div>
       </div>
       <hr class="horizontal-line">
     </div>
   </div>
   <div class="row pr-3">
         <div class="col-2 offset-8 local-header text-right">Total<br></div>
         <div class="col-2 local-header p-0 text-right">
           {{ bill.currency.isoCode }} {{ bill.totalAmount }}
         </div>
   </div>
   <div class="row pr-3">
     <div class="col-6">
       </div><div class="col-6 p-0"><div class="row text-right pr-3 mt-1"><div class="col-12 text-right local-header p-0">Amount Paid: {{ bill.amountPaid }}</div></div><div class="row text-right pr-3 mt-1"><div class="col-12 text-right local-header p-0">Balance: {{ bill.balance }}</div><div class="col-12 text-right local-header p-0"><br></div></div></div><div class="col-6 p-0"><br></div>
   </div>
   
<div class="row">
     <div class="col-6 p-0"><br>
     </div><div class="col-6 p-0"><span style="color:rgb(12, 84, 123);font-weight:700;text-align:right;"><br></span></div><div class="col-6 p-0"><span style="color:rgb(12, 84, 123);font-weight:700;text-align:right;">Payment Inquiries</span>:<br>
       <a href="mailto:ap@protranslating.com" rel="noopener noreferrer" target="_blank">AP@protranslating.com</a><br></div></div></div>`,
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const templatesCol = db.collection('templates');
    const lspCol = db.collection('lsp');
    return lspCol.findOne({ name: 'Protranslating' })
      .then((lsp) => {
        if (_.isNil(lsp)) {
          return;
        }
        templatesCol.findOne({ name: 'monthly-bill-template', lspId: lsp._id })
          .then((dbTemplate) => {
            if (_.isNil(dbTemplate)) {
              template.lspId = lsp._id;
              return templatesCol.insertOne(template);
            }
            return Promise.resolve();
          });
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
