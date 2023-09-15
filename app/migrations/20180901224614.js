const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

let database = {};
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    database = db;
    // create suggested indexes to improve performance
    return database.collection('users').createIndex({ firstName: 1, lastName: 1 });
  }).then(() => database.collection('requests').createIndex({
    lspId: 1,
    'workflows.tasks.providerTasks.provider': 1,
    'workflows.tasks.providerTasks.order': 1,
  }));

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
