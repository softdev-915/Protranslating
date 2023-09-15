const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const _ = require('lodash');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    return lspCol.findOne({ name: 'Big IP' }).then((lsp) => {
      if (_.isNil(lsp)) {
        return lspCol.insert({
          name: 'Big IP',
          description: 'Big IP',
          contactUsVendorEmails: ['nurquiza@protranslating.com', 'ptzankova@protranslating.com'],
          contactUsContactEmails: ['nurquiza@protranslating.com', 'ptzankova@protranslating.com'],
        });
      }
      return Promise.resolve();
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
