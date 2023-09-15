const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const emailHTML = `
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
  <p><a href="{{path}}requests/{{request._id}}/details">Go to this Request</a></p>`;

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const schedulers = db.collection('schedulers');
    return db.collection('lsp').findOne({ name: 'Protranslating' })
      .then(lsp =>
        schedulers.findOneAndUpdate({
          lspId: lsp._id, name: 'request-modified-pm-email' },
        { $set: { 'email.template': emailHTML } }),
      );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
