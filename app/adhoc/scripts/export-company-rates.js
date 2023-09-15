const fs = require('fs');
const _ = require('lodash');
const csvWriter = require('csv-write-stream');
const Promise = require('bluebird');
const mongo = require('../../components/database/mongo');
const configuration = require('../../components/configuration');

const headers = [
  { id: '_id', title: 'Company ID' },
  { id: 'companyId', title: 'Company ID' },
  { id: 'name', title: 'Company Name' },
  { id: 'lspId', title: 'LSP ID' },
  { id: 'ability', title: 'Ability' },
  { id: 'sourceLanguage', title: 'Source language' },
  { id: 'targetLanguage', title: 'Target language' },
  { id: 'hierarchy', title: 'Company full hierarchy' },
  { id: 'price', title: 'Price' },
  { id: 'translationUnitId', title: 'Translation Unit Id' },
  { id: 'translationUnitName', title: 'Translation Unit Name' },
  { id: 'breakdownId', title: 'Breakdown Id' },
  { id: 'breakdownName', title: 'Breakdown Name' },
  { id: 'currencyId', title: 'Currency Id' },
  { id: 'currencyName', title: 'Currency Name' },
  { id: 'internalDepartmentId', title: 'Internal Department Id' },
  { id: 'internalDepartmentName', title: 'Internal Department Name' },
];
const envConfig = configuration.environment;
mongo.connect(configuration)
  .then((connections) => connections.mongoose.connection)
  .then(async (db) => {
    console.log('Exporting company rates');
    let fuzzyBreakdownLookup;
    if (envConfig.NODE_ENV === 'PROD') {
      fuzzyBreakdownLookup = {
        from: 'fuzzyMatches',
        localField: 'billingInformation.rates.rateDetails.fuzzyMatch',
        foreignField: '_id',
        as: 'breakdownObj',
      };
    } else {
      fuzzyBreakdownLookup = {
        from: 'breakdowns',
        localField: 'billingInformation.rates.rateDetails.breakdown',
        foreignField: '_id',
        as: 'breakdownObj',
      };
    }
    const cursor = db.collection('companies').aggregate([
      {
        $match: {
          'billingInformation.rates.0': { $exists: true },
        },
      },
      {
        $unwind: '$billingInformation.rates',
      },
      {
        $unwind: '$billingInformation.rates.rateDetails',
      },
      {
        $lookup: {
          from: 'translationUnits',
          localField: 'billingInformation.rates.rateDetails.translationUnit',
          foreignField: '_id',
          as: 'translationUnitObj',
        },
      },
      {
        $lookup: {
          from: 'currencies',
          localField: 'billingInformation.rates.rateDetails.currency',
          foreignField: '_id',
          as: 'currencyObj',
        },
      },
      {
        $lookup: {
          from: 'internalDepartments',
          localField: 'billingInformation.rates.rateDetails.internalDepartment',
          foreignField: '_id',
          as: 'internalDepartmentObj',
        },
      },
      {
        $lookup: fuzzyBreakdownLookup,
      },
      {
        $project: {
          companyId: '$_id',
          name: 1,
          parentId: 1,
          subParentId: 1,
          subSubParentId: 1,
          lspId: 1,
          ability: '$billingInformation.rates.ability',
          sourceLanguage: '$billingInformation.rates.sourceLanguage.isoCode',
          targetLanguage: '$billingInformation.rates.targetLanguage.isoCode',
          hierarchy: '$hierarchy',
          price: '$billingInformation.rates.rateDetails.price',
          translationUnitId: '$translationUnitObj._id',
          breakdownId: '$breakdownObj._id',
          breakdownName: '$breakdownObj.name',
          translationUnitName: '$translationUnitObj.name',
          currencyId: '$currencyObj._id',
          currencyName: '$currencyObj.name',
          internalDepartmentId: '$internalDepartmentObj._id',
          internalDepartmentName: '$internalDepartmentObj.name',
        },
      },
    ], {
      cursor: {
        batchSize: 500,
      },
      allowDiskUse: true,
      explain: false,
    });
    const writer = csvWriter({
      headers: [
        'Company ID',
        'LSP ID',
        'Ability',
        'Source language',
        'Target language',
        'Company full hierarchy',
        'Price',
        'Translation Unit Id',
        'Translation Unit Name',
        'Breakdown Id',
        'Breakdown Name',
        'Currency Id',
        'Currency Name',
        'Internal Department Id',
        'Internal Department Name',
      ],
    });
    writer.pipe(fs.createWriteStream('companies-rates.csv'));
    let hasMoreDocs = true;
    const processDoc = async () => {
      hasMoreDocs = await cursor.hasNext();
      if (!hasMoreDocs) {
        return;
      }
      const doc = await cursor.next();
      try {
        await Promise.map(Object.keys(doc), (key) => {
          const header = headers.find((h) => h.id === key);
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
