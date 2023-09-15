const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const arabicDisclaimer = {
  country: 'Middle Eastern countries (Algeria, Bahrain, Egypt, Kuwait, Oman, Qatar, Tunisia, UAE, Morocco, Saudi Arabia)',
  codes: ['DZ', 'BH', 'EG', 'KW', 'OM', 'QA', 'TN', 'AE', 'MA', 'SA'],
  sameTranslation: true,
  disclaimer: 'The same Arabic translation can be used for {{selected_countries}}. If you proceed in more than one of these countries, the translation fee will only be billed once.',
  rule: 'If multiple Arabic language countries are selected including Saudi Arabia, display the translation fee in the line for Saudi Arabia and $0 for the rest of the Arabic language countries.',
  translationOnly: true,
  translationAndFilling: true,
};

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const lsp = db.collection('lsp');
  const wipoDisclaimers = db.collection('ip_wipo_disclaimers');
  const bigIp = await lsp.findOne({ name: 'BIG IP' });
  if (_.isNil(bigIp)) {
    return;
  }
  const d = arabicDisclaimer;
  await wipoDisclaimers.findOneAndUpdate({
    country: d.country,
    translationOnly: d.translationOnly,
  }, { $set: {
    lspId: bigIp._id,
    country: d.country,
    codes: d.codes,
    sameTranslation: d.sameTranslation,
    disclaimer: d.disclaimer,
    rule: d.rule,
    translationOnly: d.translationOnly,
    translationAndFilling: d.translationAndFilling,
  } }, { upsert: true });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
