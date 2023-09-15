const Promise = require('bluebird');
const _ = require('lodash');
const csvWriter = require('csv-write-stream');
const fs = require('fs');
const mongo = require('../../components/database/mongo');
const configuration = require('../../components/configuration');

const headers = [
  { id: '_id', title: 'ID' },
  { id: 'vendorId', title: 'Vendor ID' },
  { id: 'vendorName', title: 'Vendor Name' },
  { id: 'lspId', title: 'LSP ID' },
  { id: 'abilityId', title: 'Ability ID' },
  { id: 'abilityName', title: 'Ability name' },
  { id: 'sourceLanguage', title: 'Source Language' },
  { id: 'targetLanguage', title: 'Target Language' },
  { id: 'rate', title: 'Rate' },
];

mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    console.log('Exporting vendor min charge rates');
    const languages = await db.collection('languages').find({}).toArray();
    const cursor = db.collection('vendorMinimumCharges').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'vendor',
          foreignField: '_id',
          as: 'vendorObj',
        },
      },
      {
        $addFields: {
          vendor: { $arrayElemAt: ['$vendorObj', 0] },
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
          vendorObj: 0,
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
        'Vendor ID',
        'Vendor Name',
        'LSP ID',
        'Ability ID',
        'Ability name',
        'Source Language',
        'Target Language',
        'Rate',
      ],
    });
    writer.pipe(fs.createWriteStream('vendor-minimum-charge-rates.csv'));
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
          const vendor = _.clone(_.get(doc, 'vendor', {}));
          if (!_.isEmpty(vendor)) {
            Object.assign(doc, {
              'Vendor ID': _.get(vendor, '_id', '').toString(),
              'Vendor Name': `${vendor.firstName} ${vendor.lastName}`,
            });
            delete doc.vendor;
          }
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
