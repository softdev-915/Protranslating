const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const emailHTML = `<p>Hello {{username user}}, </p>
<p>Modified Request</p>
<p>A request has been modified. Please kindly note the changes which have been made as they may concern you.</p>
<p>Company Name: {{request.company.name}}</p>
<p>Requested By: {{username request.contact}}</p>
<p>Request Number: {{request.no}}</p>
<p>Delivery Date:{{toTimezone request.deliveryDate 'America/New_York' 'YYYY-MM-DD hh:mm A z'}}</p>
<p>Modifications:
    <table>
        <thead>
            <tr>
                <th>Element(s)</th>
                <th>Old Value</th>
                <th>New Value</th>
            </tr>
        </thead>
        <tbody>{{#each modifications}}
            <tr>
                <td>{{name}}</td>
                <td>{{oldValue}}</td>
                <td>{{value}}</td>
            </tr>{{/each}}
        </tbody>
    </table>
</p>
<p>
    <a href="{{path}}requests/{{request._id}}/details">Go to this Request</a>
</p>`;

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const schedulers = db.collection('schedulers');
    // the scheduler with this name MUST exist
    return schedulers.findOneAndUpdate({ name: 'request-modified-pm-email' }, { $set: { 'email.template': emailHTML } });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
