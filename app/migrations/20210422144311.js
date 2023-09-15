const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const emailHTML = `<p>Hello {{username user}},</p>
  <p>Modified Request</p>
  <p>A request has been modified. Please kindly note the changes which have been made as they may concern you.</p>
  <p>Company Name: {{request.company.name}}</p>
  <p>Requested By: {{username request.contact}}</p>
  <p>Request Number: {{request.no}}</p>
  <p>Delivery Date:{{toTimezone request.deliveryDate 'America/New_York' 'YYYY-MM-DD hh:mm A z'}}</p>
  <p>Documents:</p>
  <div class="divTable auto-width-table">
    <div class="divTableBody">
      <div class="divTableHeader divTableRow">
          <div class="divTableCell">Old Value</div>
          <div class="divTableCell">New Value</div>
      </div>
      {{#each documents as |document|}}
      <div class="divTableRow">
        <div class="divTableCell old"><b>{{document.oldValue}}</b></div>
        <div class="divTableCell new"><b>{{document.value}}</b></div>
      </div>
      {{/each}}
    </div>
  </div>
  <p>Modifications:</p>
  <div class="divTable auto-width-table">
    <div class="divTableBody">
      <div class="divTableHeader divTableRow">
          <div class="divTableCell">Element(s)</div>
          <div class="divTableCell">Old Value</div>
          <div class="divTableCell">New Value</div>
      </div>
      {{#each modifications as |modification|}}
      <div class="divTableRow">
        <div class="divTableCell"><b>{{modification.name}}</b></div>
        <div class="divTableCell"><b>{{modification.oldValue}}</b></div>
        <div class="divTableCell"><b>{{modification.value}}</b></div>
      </div>
      {{/each}}
    </div>
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
