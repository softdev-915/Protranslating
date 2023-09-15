/* global print, assert, db */
/**
 * Mongo Script

Usage:

$ mongo
> load('sargis-testing-script.js') // or copy and paste on terminal
true
> nsDecomissionChecks()

*/

// eslint-disable-next-line no-unused-vars
const nsDecomissionChecks = function () {
  const lspList = db.lsp.find({}, { _id: 1, name: 1 }).toArray();
  const docPTS = lspList.find(doc => doc.name === 'Protranslating');
  const PTS_ID = docPTS._id;
  let counter;
  // 20210222075911
  print('20210222075911: Confirming request-modified-pm-email scheduler email template is migrated');
  counter = db.users.find({
    lspId: PTS_ID,
    name: 'request-modified-pm-email',
    'email.template': `
    <style>
      .table {
        display: table;
        width: 500px;
        border: 1px solid;
      }
      .tr {
        display: table-row;
      }
      .td,
      .th {
        text-align: center;
        display: table-cell;
        border: 1px solid;
      }
      
      .th {
        font-weight: bold;
      }
    </style>
    <p>Hello {{username user}},</p>
    <p>Modified Request</p>
    <p>A request has been modified. Please kindly note the changes which have been made as they may concern you.</p>
    <p>Company Name: {{request.company.name}}</p>
    <p>Requested By: {{username request.contact}}</p>
    <p>Request Number: {{request.no}}</p>
    <p>Delivery Date:{{toTimezone request.deliveryDate 'America/New_York' 'YYYY-MM-DD hh:mm A z'}}</p>
    <p>Documents:</p>
    <div class="table">
      <div class="tr">
          <div class="th">Old Value</div>
          <div class="th">New Value</div>
      </div>
      {{#each documents as |document|}}
      <div class="tr">
        <div class="td old"><b>{{document.oldValue}}</b></div>
        <div class="td new"><b>{{document.value}}</b></div>
      </div>
      {{/each}}
    </div>
    <p>Modifications:</p>
    <div class="table">
      <div class="tr">
          <div class="th">Element(s)</div>
          <div class="th">Old Value</div>
          <div class="th">New Value</div>
      </div>
      {{#each modifications as |modification|}}
      <div class="tr">
        <div class="td"><b>{{modification.name}}</b></div>
        <div class="td"><b>{{modification.oldValue}}</b></div>
        <div class="td"><b>{{modification.value}}</b></div>
      </div>
      {{/each}}
    </div>
    <p><a href="{{path}}requests/{{request._id}}/details">Go to this Request</a></p>`,
  }).count(); // Should be 1
  assert(counter === 1, 'The request-modified-pm-email scheduler email template should be updated');

  // 20210219054257
  print('20210219054257: Confirming request-modified-pm-email scheduler email template is migrated');
  counter = db.users.find({
    lspId: PTS_ID,
    name: 'request-modified-pm-email',
    'email.template': { $regex: /class="divTableCell"/ },
  }).count(); // Should be 1
  assert(counter === 1, 'The request-modified-pm-email scheduler email template should be updated with divTable classes');
};

