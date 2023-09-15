const fs = require('fs');
const _ = require('lodash');
const csvWriter = require('csv-write-stream');
const Promise = require('bluebird');
const mongo = require('../../components/database/mongo');
const configuration = require('../../components/configuration');

const envConfig = configuration.environment;
const headers = [
  { id: '_id', title: 'ID' },
  { id: 'vendorId', title: 'Vendor ID' },
  { id: 'name', title: 'Vendor Name' },
  { id: 'lsp', title: 'LSP ID' },
  { id: 'abilityId', title: 'Ability ID' },
  { id: 'abilityName', title: 'Ability name' },
  { id: 'companyId', title: 'Company ID' },
  { id: 'companyName', title: 'Company name' },
  { id: 'sourceLanguage', title: 'Source language' },
  { id: 'targetLanguage', title: 'Target language' },
  { id: 'catTool', title: 'Cat tool' },
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

mongo.connect(configuration)
  .then((connections) => connections.mongoose.connection)
  .then(async (db) => {
    console.log('Exporting vendor rates');
    let fuzzyBreakdownLookup;
    if (envConfig.NODE_ENV === 'PROD') {
      fuzzyBreakdownLookup = {
        from: 'fuzzyMatches',
        localField: 'vendorDetails.rates.rateDetails.fuzzyMatch._id',
        foreignField: '_id',
        as: 'breakdownObj',
      };
    } else {
      fuzzyBreakdownLookup = {
        from: 'breakdowns',
        localField: 'vendorDetails.rates.rateDetails.breakdown._id',
        foreignField: '_id',
        as: 'breakdownObj',
      };
    }
    const cursor = db.collection('users').aggregate([
      {
        $match: {
          'vendorDetails.rates.0': { $exists: true },
        },
      },
      {
        $unwind: '$vendorDetails.rates',
      },
      {
        $unwind: '$vendorDetails.rates.rateDetails',
      },
      {
        $lookup: {
          from: 'translationUnits',
          localField: 'vendorDetails.rates.rateDetails.translationUnit._id',
          foreignField: '_id',
          as: 'translationUnitObj',
        },
      },
      {
        $lookup: {
          from: 'currencies',
          localField: 'vendorDetails.rates.rateDetails.currency._id',
          foreignField: '_id',
          as: 'currencyObj',
        },
      },
      {
        $lookup: {
          from: 'internalDepartments',
          localField: 'vendorDetails.rates.internalDepartment._id',
          foreignField: '_id',
          as: 'internalDepartmentObj',
        },
      },
      {
        $lookup: fuzzyBreakdownLookup,
      },
      {
        $addFields: {
          abilityName: '$vendorDetails.rates.ability.name',
          abilityId: '$vendorDetails.rates.ability._id',
          companyId: '$vendorDetails.rates.company._id',
          companyName: '$vendorDetails.rates.company.name',
          name: {
            $concat: ['$firstName', ' ', '$lastName'],
          },
        },
      },
      {
        $project: {
          vendorId: '$_id',
          name: 1,
          lsp: 1,
          catTool: '$vendorDetails.rates.catTool',
          abilityId: 1,
          abilityName: 1,
          companyId: 1,
          companyName: 1,
          sourceLanguage: '$vendorDetails.rates.sourceLanguage.isoCode',
          targetLanguage: '$vendorDetails.rates.targetLanguage.isoCode',
          price: '$vendorDetails.rates.rateDetails.price',
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
        'Company ID',
        'Company name',
        'Source language',
        'Target language',
        'Cat tool',
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
    writer.pipe(fs.createWriteStream('vendor-rates.csv'));
    let hasMoreDocs = true;
    const processDoc = async () => {
      hasMoreDocs = await cursor.hasNext();
      if (!hasMoreDocs) {
        return;
      }
      const doc = await cursor.next();
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
