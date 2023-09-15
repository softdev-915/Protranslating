const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const schedulers = db.collection('schedulers');
  const agendaJobs = db.collection('agendaJobs');
  const lsp = db.collection('lsp');

  await schedulers.deleteMany({ name: 'contact-us-notification' });
  await agendaJobs.deleteMany({ name: /contact-us-notification/ });

  const lspNames = await lsp.distinct('name');
  await lsp.updateMany({ name: { $in: lspNames } }, {
    $unset: {
      contactUsVendorEmails: null,
      contactUsContactEmails: null,
      officialSupportEmail: null,
      lspCssUri: null,
    },
  });
};

if (require.main === module) {
  migration()
    .then(() => process.exit(0))
    .catch((err) => { throw err; });
} else {
  module.exports = migration;
}
