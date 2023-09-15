const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const CUSTOMIZED_QUOTE_TEMPLATE = {
  name: 'Requesting Customized Quote Email Template',
  type: 'Quote Email',
  template: `
  <p><strong>Dear BIG IP Operations Team:</strong></p>
  <br/><br/>
  <p>An IP quote associated with a BIG IP request {{request.no}} has been created and is waiting for a customized quote to be attached.</p>
  <br/><br/>
  <a href="{{path}}requests/{{request._id}}/details" target="_blank">Go to the Request (IP Quote)</a>
  <br/>`,
};

const CUSTOMIZED_QUOTE_COMPLETED_TEMPLATE = {
  name: 'Customized Quote Completed Email Template',
  type: 'Quote Email',
  template: `
  <p><strong>Dear {{user.firstName}} {{user.lastName}}</strong></p>
  <br/><br/>
  <p>Your customized quote has been completed and it is ready for review. Please click on the link below to access your quote.</p>
  <br/><br/>
  <a href="{{path}}ip-quotes/{{request._id}}/details" target="_blank">Go to the Quote</a>
  <br/>`,
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const templatesCol = db.collection('templates');
    const lspCol = db.collection('lsp');
    return Promise.each(
      [CUSTOMIZED_QUOTE_TEMPLATE, CUSTOMIZED_QUOTE_COMPLETED_TEMPLATE],
      template => lspCol.findOne({ name: 'BIG IP' })
        .then(lsp =>
          templatesCol.findOne({ name: template.name, lspId: lsp._id })
            .then((dbTemplate) => {
              if (_.isNil(dbTemplate)) {
                template.lspId = lsp._id;
                return templatesCol.insertOne(template);
              }
              return templatesCol.updateOne(
                { _id: template._id },
                { $set: {
                  name: template.name,
                  template: template.template,
                  type: template.type },
                });
            })));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
