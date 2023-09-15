const _ = require('lodash');
const csvParse = require('csv-parse');
const fs = require('fs');
const async = require('async');
const { Types: { ObjectId } } = require('mongoose');
const mongo = require('../../components/database/mongo');
const configuration = require('../../components/configuration');
const Promise = require('bluebird');

const filePath = process.argv[2];
if (_.isEmpty(filePath)) {
  throw new Error('File path is mandatory');
}
mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    const companiesCol = db.collection('companies');
    const languagesCol = db.collection('languages');
    const updateDb = async (groupedRates) => {
      const languages = await languagesCol.find({}).toArray();
      return Promise.mapSeries(Object.keys(groupedRates), async (key) => {
        try {
          const rate = groupedRates[key];
          const company = await companiesCol.findOne({ _id: new ObjectId(rate[0][0]) });
          const rates = _.get(company, 'billingInformation.rates', []);
          if (rate.length > 0) {
            let newRate;
            rate.forEach((rateDetail, index) => {
              const sourceLanguage = languages.find(l => l.isoCode === rateDetail[3].trim());
              const targetLanguage = languages.find(l => l.isoCode === rateDetail[4].trim());
              const newRateDetail = {
                price: _.toNumber(rateDetail[6]),
              };
              if (!_.isEmpty(rateDetail[9])) {
                try {
                  newRateDetail.breakdown = new ObjectId(rateDetail[9]);
                } catch (error) {
                  console.log(error);
                }
              } else {
                newRateDetail.breakdown = null;
              }
              if (!_.isEmpty(rateDetail[11])) {
                try {
                  newRateDetail.currency = new ObjectId(rateDetail[11]);
                } catch (error) {
                  console.log(error);
                }
              } else {
                newRateDetail.currency = null;
              }
              if (!_.isEmpty(rateDetail[7])) {
                try {
                  newRateDetail.translationUnit = new ObjectId(rateDetail[7]);
                } catch (error) {
                  console.log(error);
                }
              } else {
                newRateDetail.translationUnit = null;
              }
              if (!_.isEmpty(rateDetail[13])) {
                try {
                  newRateDetail.internalDepartment = new ObjectId(rateDetail[13]);
                } catch (error) {
                  console.log(error);
                }
              } else {
                newRateDetail.internalDepartment = null;
              }
              if (index === 0) {
                newRate = {
                  ability: rateDetail[2],
                  rateDetails: [newRateDetail],
                  sourceLanguage: {
                    _id: null,
                    name: '',
                    isoCode: '',
                  },
                  targetLanguage: {
                    _id: null,
                    name: '',
                    isoCode: '',
                  },
                };
                if (!_.isNil(sourceLanguage)) {
                  newRate.sourceLanguage = _.pick(sourceLanguage, ['_id', 'name', 'isoCode']);
                }
                if (!_.isNil(targetLanguage)) {
                  newRate.targetLanguage = _.pick(targetLanguage, ['_id', 'name', 'isoCode']);
                }
              } else {
                newRate.rateDetails.push(newRateDetail);
              }
            });
            newRate._id = new ObjectId();
            if (rates.length === 0) {
              rates.push(newRate);
            } else {
              // Check first if the rate + rate detail exists
              const existingRate = rates.find((r) => {
                const sourceLanguageId = _.get(r, 'sourceLanguage._id', '');
                const newRateSourceLanguageId = _.get(newRate, 'sourceLanguage._id', '');
                const targetLanguageId = _.get(r, 'sourceLanguage._id', '');
                const newRateTargetLanguageId = _.get(newRate, 'targetLanguage._id', '');
                return _.defaultTo(sourceLanguageId, '').toString() === _.defaultTo(newRateSourceLanguageId, '').toString() &&
                _.defaultTo(targetLanguageId, '').toString() === _.defaultTo(newRateTargetLanguageId, '').toString() &&
                _.get(r, 'ability', '') === _.get(newRate, 'ability', '');
              });
              if (_.isNil(existingRate)) {
                rates.push(newRate);
              } else {
                existingRate.rateDetails.push(newRate.rateDetails);
              }
            }
          }
          if (!_.isEmpty(rates)) {
            if (!_.isNil(company)) {
              console.log(`Updating rates for company with id ${company._id.toString()}`);
              return companiesCol.updateOne({ _id: company._id }, {
                $set: {
                  'billingInformation.rates': rates,
                },
              });
            }
          }
        } catch (error) {
          console.log(`Failed with error ${error}`);
          process.exit();
        }
      });
    };

    const parser = csvParse({ delimiter: ',' }, (err, data) => {
      const companyRates = _.groupBy(data, (r, index) => {
        if (index !== 0) {
          return r[0];
        }
      });
      let i = 0;

      async.eachSeries(companyRates, (row, callback) => {
        if (i > 0) {
          const groupedRates = _.chain(row).filter(item => item).groupBy(item => `${item[0]}-${item[2]}-${item[3]}-${item[4]}`).value();
          updateDb(groupedRates).then(() => {
            i++;
            callback();
          }).catch((error) => {
            console.log(`Failed with err: ${error}`);
          });
        } else {
          i++;
          callback();
        }
      }, () => {
        console.log('Finished process');
        process.exit();
      });
    });
    return fs.createReadStream(filePath).pipe(parser);
  });
