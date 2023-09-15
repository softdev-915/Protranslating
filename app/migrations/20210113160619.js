const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { insertIfMissing } = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const schedulersCol = db.collection('schedulers');
    const connectorScheduler = {
      name: 'si-connector',
      every: '1 hours',
      options: { lockLifetime: 1e4, priority: 'highest' },
    };
    const query = { name: 'si-connector' };
    return lspCol.find({}).toArray()
      .then(lsps => Promise.each(lsps, lsp =>
        insertIfMissing(schedulersCol, query, connectorScheduler, lsp)));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
