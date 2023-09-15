const Promise = require('bluebird');
const _ = require('lodash');
const csvWriter = require('csv-write-stream');
const fs = require('fs');
const mongo = require('../../components/database/mongo');
const configuration = require('../../components/configuration');

const headers = [
  { id: '_id', title: 'ID' },
  { id: 'companyId', title: 'Company ID' },
  { id: 'companyName', title: 'Company Name' },
  { id: 'lspId', title: 'LSP ID' },
  { id: 'abilityId', title: 'Ability ID' },
  { id: 'abilityName', title: 'Ability name' },
  { id: 'sourceLanguage', title: 'Source Language' },
  { id: 'targetLanguage', title: 'Target Language' },
  { id: 'minCharge', title: 'Rate' },
];

mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    console.log('Exporting company min charge rates');
    const languages = await db.collection('languages').find({}).toArray();
    const cursor = db.collection('companyMinimumCharges').aggregate([
      {
        $addFields: {
          companyId: '$company._id',
          companyName: '$company.hierarchy',
          abilityId: '$ability._id',
          abilityName: '$ability.name',
        },
      },
      {
        $project: {
          createdAt: 0,
          updatedAt: 0,
          ability: 0,
          __v: 0,
          deleted: 0,
          companyObj: 0,
        },
      },
    ], {
      cursor: {
        batchSize: 1000,
      },
      allowDiskUse: true,
      explain: false,
    });
    const writer = csvWriter({
      headers: [
        'LSP ID',
        'Company Name',
        'Company ID',
        'Ability ID',
        'Ability name',
        'Source Language',
        'Target Language',
        'Rate',
      ],
    });
    writer.pipe(fs.createWriteStream('company-minimum-charge-rates.csv'));
    let hasMoreDocs = true;
    const processDoc = async () => {
      hasMoreDocs = await cursor.hasNext();
      if (!hasMoreDocs) {
        return;
      }
      const doc = await cursor.next();
      if (Array.isArray(doc.languageCombinations) && !_.isEmpty(doc.languageCombinations)) {
        const sourceLanguageName = doc.languageCombinations[0].split('-')[0].trim();
        const targetLanguageName = doc.languageCombinations[0].split('-')[1].trim();
        const sourceLanguageDb = languages.find(l => l.name === sourceLanguageName);
        const targetLanguageDb = languages.find(l => l.name === targetLanguageName);
        if (!_.isNil(sourceLanguageDb)) {
          doc.sourceLanguage = sourceLanguageDb.isoCode;
        }
        if (!_.isNil(targetLanguageDb)) {
          doc.targetLanguage = targetLanguageDb.isoCode;
        }
      }
      try {
        await Promise.map(Object.keys(doc), (key) => {
          const header = headers.find(h => h.id === key);
          if (!_.isNil(header)) {
            doc[header.id] = _.get(doc, key);
            Object.assign(doc, {
              [header.title]: _.get(doc, key),
            });
            delete doc[key];
          }
        });
        writer.write(doc);
      } catch (error) {
        console.log(error);
      }
      await processDoc();
    };
    await processDoc();
    console.log('Finished writing');
    await writer.end();
    process.exit();
  });
