const _ = require('lodash');
const csvParse = require('csv-parse');
const fs = require('fs');
const async = require('async');
const { Types: { ObjectId } } = require('mongoose');
const mongo = require('../../components/database/mongo');
const configuration = require('../../components/configuration');

const filePath = process.argv[2];
if (_.isEmpty(filePath)) {
  throw new Error('File path is mandatory');
}
mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    console.log('Importing vendor minimum charge rates');
    try {
      const vendorMinimumChargeCollection = db.collection('vendorMinimumCharges');
      const languages = await db.collection('languages').find({}).toArray();
      const updateDb = async (row, columns) => {
        columns.forEach((c, index) => {
          row[c] = row[index];
        });
        const lspId = row[2].trim();
        const vendorId = row[0].trim();
        const abilityId = row[3].trim();
        const abilityName = row[4].trim();
        const sourceLanguageIsoCode = row[5].trim();
        const targetLanguageIsoCode = row[6].trim();
        const rate = row[7].trim();
        let sourceLanguageName;
        let targetLanguageName;
        const searchQuery = {
          lspId: new ObjectId(lspId),
          vendor: new ObjectId(vendorId),
          'ability.name': abilityName,
        };
        let languageCombinations = [];
        if (!_.isEmpty(sourceLanguageIsoCode) && !_.isEmpty(targetLanguageIsoCode)) {
          const sourceLanguageDb = languages.find(l => l.isoCode === sourceLanguageIsoCode);
          const targetLanguageDb = languages.find(l => l.isoCode === targetLanguageIsoCode);
          if (!_.isNil(sourceLanguageDb)) {
            sourceLanguageName = sourceLanguageDb.name;
          }
          if (!_.isNil(targetLanguageDb)) {
            targetLanguageName = targetLanguageDb.name;
          }
          if (!_.isEmpty(sourceLanguageName) && !_.isEmpty(targetLanguageName)) {
            searchQuery.languageCombinations = { $in: [`${sourceLanguageName} - ${targetLanguageName}`] };
            languageCombinations = [`${sourceLanguageName} - ${targetLanguageName}`];
          }
        }
        return vendorMinimumChargeCollection.updateOne(searchQuery, {
          $set: {
            lspId: new ObjectId(lspId),
            vendor: new ObjectId(vendorId),
            ability: {
              _id: new ObjectId(abilityId),
              name: abilityName,
            },
            languageCombinations,
            rate,
          },
        }, { upsert: true });
      };
      const parser = csvParse({ delimiter: ',' }, (err, data) => {
        let i = 0;
        let columns = [];
        async.eachSeries(data, (row, callback) => {
          if (i === 0) {
            columns = row;
            i++;
            callback();
          } else {
            updateDb(row, columns).then(() => {
              callback();
            });
          }
        }, () => {
          console.log('Finished process');
          process.exit();
        });
      });
      return fs.createReadStream(filePath).pipe(parser);
    } catch (err) {
      console.log(`Failed with error ${err}`);
      process.exit();
    }
  });
