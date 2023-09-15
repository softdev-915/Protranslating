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
    console.log('Importing company minimum charge rates');
    try {
      const companyMinimumChargesCol = db.collection('companyMinimumCharges');
      const languages = await db.collection('languages').find({}).toArray();
      const updateDb = async (row, columns) => {
        columns.forEach((c, index) => {
          row[c] = row[index];
        });
        const lspId = row[0].trim();
        const companyId = row[2].trim();
        const companyDb = await db.collection('companies').findOne({
          _id: new ObjectId(companyId),
        });
        const abilityId = row[3].trim();
        const abilityName = row[4];
        const sourceLanguageIsoCode = row[5].trim();
        const targetLanguageIsoCode = row[6].trim();
        const rate = row[7];
        let sourceLanguageName;
        let targetLanguageName;
        const searchQuery = {
          lspId: new ObjectId(lspId),
          'company._id': new ObjectId(companyId),
          'ability.name': abilityName,
        };
        if (!_.isEmpty(sourceLanguageIsoCode) && !_.isEmpty(targetLanguageIsoCode)) {
          const sourceLanguageDb = languages.find(l => l.isoCode === sourceLanguageIsoCode);
          const targetLanguageDb = languages.find(l => l.isoCode === targetLanguageIsoCode);
          if (!_.isNil(sourceLanguageDb)) {
            sourceLanguageName = sourceLanguageDb.name;
          }
          if (!_.isNil(targetLanguageDb)) {
            targetLanguageName = targetLanguageDb.name;
          }
          searchQuery.languageCombinations = `${sourceLanguageName} - ${targetLanguageName}`;
        }
        return companyMinimumChargesCol.updateOne(searchQuery, {
          $set: {
            lspId: new ObjectId(lspId),
            company: _.pick(companyDb, ['_id', 'name', 'hierarchy']),
            ability: {
              _id: new ObjectId(abilityId),
              name: abilityName,
            },
            languageCombinations: [`${sourceLanguageName} - ${targetLanguageName}`],
            minCharge: rate,
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
    } catch (error) {
      console.log(`Failed with error ${error}`);
      process.exit();
    }
  });
