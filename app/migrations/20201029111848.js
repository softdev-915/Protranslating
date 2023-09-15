const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const template = {
  name: 'Email Template PTS',
  type: 'Quote Email',
  template: `
  <p>
    Client Module: New Quote&nbsp;<br />
    A quote on your request has been made by {LSP} and is waiting for your approval.&nbsp;<br />
    Attached please find a copy of the quote in PDF file format.&nbsp;<br />
    Request Number: {{request.no}}&nbsp;<br />
    Document name(s): {{#each documents}}{{name}}, {{/each}}&nbsp;<br />
    Request title: {{request.title}}&nbsp;<br />
    Turnaround time: {{request.turnaroundTime}}&nbsp;<br />
    Terms and Conditions: {{emailCustom.termsAndConditions}}&nbsp;<br />
    <br />
    Go to Quote Approval&nbsp;<a href="{{path}}requests/{{request._id}}/details/quote" target="_blank" rel="noopener noreferrer">here</a><br />
</p>
  `,
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const templatesCol = db.collection('templates');
    const lspCol = db.collection('lsp');
    return lspCol.findOne({ name: 'Protranslating' })
      .then(lsp =>
        templatesCol.findOne({ name: 'Email Template PTS', lspId: lsp._id })
          .then((dbTemplate) => {
            if (_.isNil(dbTemplate)) {
              template.lspId = lsp._id;
              return templatesCol.insertOne(template);
            }
            return Promise.resolve();
          }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
