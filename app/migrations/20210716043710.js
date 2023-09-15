const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const CUSTOMIZED_QUOTE_COMPLETED_TEMPLATE = {
  name: 'Customized Quote Completed Email Template',
  type: 'Quote Email',
  template: `
  <p><strong>Dear {{contact.firstName}} {{contact.lastName}}</strong></p>
  <br/><br/>
  <p>Your customized quote {{request.no}} is ready for review. Please click on the link below to access your quote.</p>
  <br/><br/>
  <a href="{{path}}requests/{{request._id}}/details" target="_blank">Go to the Quote</a>
  <br/>`,
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const templatesCol = db.collection('templates');
    const lspCol = db.collection('lsp');
    return lspCol.findOne({ name: 'BIG IP' })
      .then(lsp =>
        templatesCol.findOne({ name: CUSTOMIZED_QUOTE_COMPLETED_TEMPLATE.name, lspId: lsp._id })
          .then((dbTemplate) => {
            if (_.isNil(dbTemplate)) {
              CUSTOMIZED_QUOTE_COMPLETED_TEMPLATE.lspId = lsp._id;
              return templatesCol.insertOne(CUSTOMIZED_QUOTE_COMPLETED_TEMPLATE);
            }
            return templatesCol.updateOne(
              { _id: dbTemplate._id },
              { $set: {
                name: CUSTOMIZED_QUOTE_COMPLETED_TEMPLATE.name,
                template: CUSTOMIZED_QUOTE_COMPLETED_TEMPLATE.template,
                type: CUSTOMIZED_QUOTE_COMPLETED_TEMPLATE.type },
              });
          }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
