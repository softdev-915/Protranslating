const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const agendaJobsCol = db.collection('agendaJobs');
    const lspCol = db.collection('lsp');
    return lspCol.findOne({ name: 'Protranslating' }).then(lsp =>
      // We need to add lspId to all jobs that are scheduled for running
      // and don't have lspID in the data key
      agendaJobsCol.update({
        'data.lspId': {
          $exists: false,
        },
        data: {
          $ne: null,
        },
        name: {
          $ne: 'run migrations',
        },
        nextRunAt: {
          $ne: null,
        },
      }, {
        $set: {
          'data.lspId': lsp._id,
        },
      }, { multi: true }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
