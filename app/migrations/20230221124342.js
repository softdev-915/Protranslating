const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const companyMinimumChargesCol = db.collection('companyMinimumCharges');
  const languagesCol = db.collection('languages');
  const stream = companyMinimumChargesCol.find({
    languageCombinations: {
      $exists: true,
      $not: { $size: 0 },
    },
    'languageCombinations.0.text': {
      $exists: false,
    },
  }).stream();
  stream.on('error', (err) => {
    throw err;
  });
  stream.on('data', async (record) => {
    stream.pause();
    try {
      const languageCombinationSourceLanguage = record.languageCombinations[0].split('-')[0].trim();
      const languageCombinationTargetLanguage = record.languageCombinations[0].split('-')[1].trim();
      const languagesInDb = await languagesCol.find({
        name: {
          $in: [
            languageCombinationSourceLanguage,
            languageCombinationTargetLanguage,
          ],
        },
      }).toArray();
      const sourceLanguage = languagesInDb.find(l => l.name === languageCombinationSourceLanguage);
      const targetLanguage = languagesInDb.find(l => l.name === languageCombinationTargetLanguage);
      if (_.isNil(sourceLanguage) || _.isNil(targetLanguage)) {
        return stream.resume();
      }
      const languageCombination = {
        text: record.languageCombinations[0],
        value: [{
          _id: sourceLanguage._id,
          value: sourceLanguage.isoCode,
          text: sourceLanguage.name,
        },
        {
          _id: targetLanguage._id,
          value: targetLanguage.isoCode,
          text: targetLanguage.name,
        },
        ],
      };
      await companyMinimumChargesCol.updateOne(
        { _id: record._id },
        { $set: { languageCombinations: [languageCombination] } },
      );
      stream.resume();
    } catch (e) {
      console.log(`Error ocurred ${e}`);
      stream.resume();
    }
    stream.resume();
  });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
