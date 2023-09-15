const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const envConfig = configuration.environment;
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const currenciesCol = db.collection('currencies');
    let bigEur;
    let ptsLsp;
    if (envConfig.NODE_ENV === 'PROD') {
      return Promise.resolve();
    }
    return lspCol.find({ $or: [{ name: 'Protranslating' }, { name: 'BIG-LS EUR' }] }).toArray()
      .then((lspList) => {
        ptsLsp = lspList.find(l => l.name === 'Protranslating');
        bigEur = lspList.find(l => l.name === 'BIG-LS EUR');
        return currenciesCol.findOne({ isoCode: 'EUR', lspId: bigEur._id })
          .then((eurCurrency) => {
            const currencyExchangeDetails = [{
              base: eurCurrency._id,
              quote: eurCurrency._id,
              quotation: 1,
            }];
            return lspCol.updateOne({ _id: bigEur._id },
              {
                $set: {
                  addressInformation: ptsLsp.addressInformation,
                  securityPolicy: ptsLsp.securityPolicy,
                  customQuerySettings: ptsLsp.customQuerySettings,
                  emailConnectionString: ptsLsp.emailConnectionString,
                  contactUsVendorEmails: ptsLsp.contactUsVendorEmails,
                  contactUsContactEmails: ptsLsp.contactUsContactEmails,
                  currencyExchangeDetails,
                },
              });
          });
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
