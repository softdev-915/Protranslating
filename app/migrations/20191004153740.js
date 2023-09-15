const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lsp = db.collection('lsp');
    return lsp.updateOne({ name: 'Protranslating' }, {
      $set: {
        description: 'Translation Services (written)',
        contactUsVendorEmails: ['freelance@protranslating.com', 'cestefani@protranslating.com',
          'nurquiza@protranslating.com'],
        contactUsContactEmails: ['clientservices@protranslating.com', 'cestefani@protranslating.com',
          'nurquiza@protranslating.com'],
      },
    }).then(() => (
      lsp.updateOne({ name: 'PTI' }, {
        $set: {
          description: 'Interpreting Services (oral)',
          contactUsVendorEmails: ['freelance@protranslating.com', 'cestefani@protranslating.com',
            'nurquiza@protranslating.com'],
          contactUsContactEmails: ['clientservices@protranslating.com', 'cestefani@protranslating.com',
            'nurquiza@protranslating.com'],
        },
      })
    ));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
