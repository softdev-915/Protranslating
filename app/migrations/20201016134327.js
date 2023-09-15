const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const envConfig = configuration.environment;
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    if (envConfig.NODE_ENV !== 'PROD') {
      return lspCol.findOne({ name: 'BIG-LS EUR' }).then((lsp) => {
        if (_.isNil(lsp)) {
          return lspCol.insert({ name: 'BIG-LS EUR' });
        }
        return Promise.resolve();
      });
    }
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
