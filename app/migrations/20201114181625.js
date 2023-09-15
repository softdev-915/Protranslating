const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const envConfig = configuration.environment;
const emailHTML = `<p>Hello {{username user}},</p>
  <p>Modified Request</p>
  <p>A request has been modified. Please kindly note the changes which have been made as they may concern you.</p>
  <p>Company Name: {{request.company.name}}</p>
  <p>Requested By: {{username request.contact}}</p>
  <p>Request Number: {{request.no}}</p>
  <p>Delivery Date:{{toTimezone request.deliveryDate 'America/New_York' 'YYYY-MM-DD hh:mm A z'}}</p>
  <p>Documents:</p>
  <table>
    <tbody>
        <tr>
          <th>Old Value</th>
          <th>New Value</th>
        </tr>
    </tbody>
    <tbody>
        {{#each documents}}
        <tr>
          <td class="old">{{oldValue}}</td>
          <td class="new">{{value}}</td>
        </tr>
        {{/each}}
    </tbody>
  </table>
  <p>Modifications:</p>
  <table>
    <thead>
        <tr>
          <th>Element(s)</th>
          <th>Old Value</th>
          <th>New Value</th>
        </tr>
    </thead>
    <tbody>
        {{#each modifications}}
        <tr>
          <td>{{name}}</td>
          <td>{{oldValue}}</td>
          <td>{{value}}</td>
        </tr>
        {{/each}}
    </tbody>
  </table>
  <p><a href="{{path}}requests/{{request._id}}/details">Go to this Request</a></p>`;

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    if (envConfig.NODE_ENV === 'TEST' || envConfig.NODE_ENV === 'DEV') {
      const schedulers = db.collection('schedulers');
      return db.collection('lsp').find({ $or: [{ name: 'Protranslating' }, { name: 'PTI' }] }).toArray()
        .then((lsps) => {
          if (lsps && lsps.length) {
            return Promise.all(lsps.map(lsp =>
              schedulers.findOneAndUpdate({
                lspId: lsp._id, name: 'request-modified-pm-email' },
              { $set: { 'email.template': emailHTML } }),
            ));
          }
        });
    }
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
