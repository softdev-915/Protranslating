const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const emailBigTemplate = {
  name: 'Email Template BIG',
  template: `<p>
    Client Module: New Quote <br />
    A quote on your request has been made by {{lsp.name}} and is waiting for your review. <br />
    Attached please find a copy of the quote in PDF file format. <br />
    Request Number: {{request.no}} <br />
    Document name(s): {{#each documents}}{{name}}, {{/each}} <br />
    Request title: {{request.title}} <br />
    Turnaround time: {{request.turnaroundTime}} <br />
    Terms and Conditions: {{emailCustom.termsAndConditions}} <br />
    <br />
    Go to Quote <a href="{{path}}requests/{{request._id}}/details/quote" target="_blank" rel="noopener noreferrer">here</a><br />
  </p>`,
};
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const templatesCol = db.collection('templates');
    const lspCol = db.collection('lsp');
    return lspCol.findOne({ name: 'BIG IP' }).then(lsp =>
      templatesCol.findOne({ name: emailBigTemplate.name, lspId: lsp._id })
        .then((dbTemplate) => {
          if (_.isNil(dbTemplate)) {
            delete emailBigTemplate._id;
            emailBigTemplate.lspId = lsp._id;
            return templatesCol.insertOne(emailBigTemplate);
          }
          return templatesCol.updateOne({
            _id: dbTemplate._id,
          }, {
            $set: {
              template: emailBigTemplate.template,
            },
          });
        }),
    );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
