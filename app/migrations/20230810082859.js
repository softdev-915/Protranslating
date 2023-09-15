const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');
const WIPOTranslationFeesJSON = require('./data/20230810082859/wipo-translation-fees.json');
const WIPOCountriesJSON = require('./data/20230810082859/wipo-countries.json');
const newWIPOCustomCountriesJSON = require('./data/20230810082859/new-wipo-custom-countries.json');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const wipoTranslationFeesCollection = db.collection('ip_wipo_translation_fees');
  const wipoCountriesCollection = db.collection('ip_wipo_countries');
  const wipoDisclaimers = db.collection('ip_wipo_disclaimers');
  const lspCol = db.collection('lsp');
  const bigIpLsp = await lspCol.findOne({ name: 'BIG IP' });
  if (_.isNil(bigIpLsp)) return;
  const totalWordCount = '({descriptionWordCount}+{claimsWordCount}+{drawingsWordCount}+{abstractWordCount})';

  await wipoCountriesCollection.insertMany(newWIPOCustomCountriesJSON);

  await Promise.map(WIPOCountriesJSON, c =>
    wipoCountriesCollection.findOneAndUpdate({
      name: c.name,
    }, {
      $set: {
        deDirectIq: c.deDirectIq,
        frDirectIq: c.frDirectIq,
      },
    }),
  );

  await Promise.map(newWIPOCustomCountriesJSON, c =>
    wipoTranslationFeesCollection.deleteOne({ country: c.name }),
  );

  await Promise.map(WIPOTranslationFeesJSON, fee =>
    wipoTranslationFeesCollection.findOneAndUpdate({
      country: fee.country,
    }, {
      $set: {
        deTranslationRate: fee.deTranslationRate,
        frTranslationRate: fee.frTranslationRate,
      },
      $rename: {
        translationRate: 'enTranslationRate',
      },
    }),
  );

  await wipoTranslationFeesCollection.insertOne({
    country: 'English Translation',
    deTranslationRate: '0.18',
    frTranslationRate: '0.18',
    deTranslationFormula: `${totalWordCount}*1.25*{translationRate}`,
    frTranslationFormula: `${totalWordCount}*{translationRate}`,
  });

  await wipoDisclaimers.insertMany([
    {
      country: 'Indirect Translation Countries',
      translationOnly: true,
      codes: [],
      disclaimer: 'In order to ensure a quality translation certain languages will have to be relayed through English. Please contact your BIG IP rep for further information.',
      lspId: bigIpLsp._id,
      rule: 'Show if indirect translation is required for at least one target country',
      sameTranslation: true,
      translationAndFilling: true,
    },
    {
      country: 'Russian countries(Eurasia, Russian Federation)',
      translationOnly: true,
      codes: ['RU', 'EA'],
      disclaimer: 'The same Russian translation can be used for {{selected_countries}}. If you proceed in more than one of these countries, the translation fee will only be billed once.',
      lspId: bigIpLsp._id,
      rule: 'If multiple Russian language countries are selected including Eurasia display the translation fee in the line for Eurasia and $0 for the rest of the Russian language countries.',
      sameTranslation: true,
      translationAndFilling: true,
    },
    {
      country: 'English countries (ARIPO, Australia, Canada, Europe, India, Israel, Malaysia, New Zealand, OAPI, Philippines,Singapore, South Africa, United States)',
      translationOnly: true,
      codes: ['AP', 'AU', 'CA', 'EP', 'IN', 'IL', 'MY', 'NZ', 'OA', 'PH', 'SG', 'ZA', 'US'],
      disclaimer: 'The same English translation can be used for {{selected_countries}}. If you proceed in more than one of these countries, the translation fee will only be billed once.',
      lspId: bigIpLsp._id,
      rule: 'If SL=GER, FRE and multiple English language countries are selected including Australia display the translation fee in the line for Australia and $0 for the rest of the English language countries.',
      sameTranslation: true,
      translationAndFilling: true,
    },
  ]);
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
