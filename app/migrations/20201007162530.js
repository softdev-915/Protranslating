const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const { removeRoles } = require('../utils/migrations');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const collections = {
      users: db.collection('users'),
      groups: db.collection('groups'),
      roles: db.collection('roles'),
    };
    return removeRoles(['WORKFLOW-TASK-FINANCIAL_CREATE_ALL', 'WORKFLOW-TASK-FINANCIAL_UPDATE_ALL', 'WORKFLOW-TASK-FINANCIAL_READ_ALL'], collections);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
