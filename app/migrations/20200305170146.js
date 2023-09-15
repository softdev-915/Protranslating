const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(db =>
    db.collection('requests').update({
      'workflows.tasks.providerTasks.files.md5Hash': { $exists: false },
    }, {
      $set: {
        'workflows.$[].tasks.$[].providerTasks.$[].files.$[].md5Hash': 'default',
      },
    }, { multi: true }),
  );

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
