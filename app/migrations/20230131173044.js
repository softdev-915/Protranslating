const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const PORTAL_MT_PROVIDER = 'Portal MT';
const GOOGLE_MT_PROVIDER = 'Google MT';
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    try {
      const lspCol = db.collection('lsp');
      const mtProviderCol = db.collection('mtProviders');
      const mtEngineCol = db.collection('mtEngines');
      const companyCol = db.collection('companies');
      const promises = [];
      promises.push(lspCol.find({
        $or: [{
          name: 'Protranslating',
        }, {
          name: 'PTI',
        }, {
          name: 'BIG IP',
        }],
      }).toArray()
        .then(lsps =>
          Promise.mapSeries(lsps, (lsp) => {
            const providerPromise = mtProviderCol.updateMany({
              lspId: lsp._id,
              name: PORTAL_MT_PROVIDER,
            }, {
              $set: {
                name: PORTAL_MT_PROVIDER,
              },
            }, {
              upsert: true,
            });
            const portalMtEnginePromise = mtEngineCol.updateMany({
              lspId: lsp._id,
              mtProvider: PORTAL_MT_PROVIDER,
              apiKey: 'no_key',
              isEditable: false,
            }, {
              $set: {
                mtProvider: PORTAL_MT_PROVIDER,
                apiKey: 'no_key',
                isEditable: false,
              },
            }, {
              upsert: true,
            });
            const googleMtEnginePromise = mtEngineCol.updateMany({
              lspId: lsp._id,
              mtProvider: GOOGLE_MT_PROVIDER,
            }, {
              $set: {
                isEditable: true,
              },
            }, { upsert: true });
            const companiesPromise = companyCol.updateMany(
              { lspId: lsp._id, 'mtSettings.languageCombinations': { $exists: true } },
              {
                $set: {
                  'mtSettings.languageCombinations.$[].mtEngine': GOOGLE_MT_PROVIDER,
                },
                $unset: {
                  'mtSettings.languageCombinations.$[].isActive': '',
                },
              },
            );
            return Promise.all([
              providerPromise,
              portalMtEnginePromise,
              googleMtEnginePromise,
              companiesPromise,
            ]);
          }),
        ));
      return Promise.all(promises);
    } catch (e) {
      throw e;
    }
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { console.log(err); throw err; });
} else {
  module.exports = migration;
}
