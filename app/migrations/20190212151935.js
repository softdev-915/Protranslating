const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const ORDER_INDEX = 'lspId_1_workflows.tasks.providerTasks.provider_1_workflows.tasks.providerTasks.order_1';
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(db => db.collection('requests').getIndexes().then((indexes) => {
    const indexesNames = Object.keys(indexes);
    if (indexesNames.indexOf(ORDER_INDEX) !== -1) {
      return db.collection('requests').dropIndex(ORDER_INDEX);
    }
  }));

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
