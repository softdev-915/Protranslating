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
    const usersCol = db.collection('users');
    const languagesCol = db.collection('languages');
    const languages = await languagesCol.find({}).toArray();
    const updateDb = async groupedRates =>
      Promise.mapSeries(Object.keys(groupedRates), async (key) => {
        try {
          const rate = groupedRates[key];
          const userId = rate[0][0];
          const user = await usersCol.findOne({ _id: new ObjectId(userId) });
          const rates = _.get(user, 'vendorDetails.rates', []);
          if (rate.length > 0) {
            let newRate;
            rate.forEach((rateDetail, index) => {
              const catTool = rateDetail[9];
              let sourceLanguage;
              let targetLanguage;
              if (!_.isEmpty(rateDetail[7].trim())) {
                sourceLanguage = languages.find(l => l.isoCode === rateDetail[7].trim());
                targetLanguage = languages.find(l => l.isoCode === rateDetail[8].trim());
              }
              const newRateDetail = {
                price: _.toNumber(rateDetail[10]),
              };
              if (!_.isEmpty(rateDetail[13])) {
                newRateDetail.breakdown = {
                  _id: new ObjectId(rateDetail[13]),
                  name: rateDetail[14],
                };
              } else {
                newRateDetail.breakdown = null;
              }
              if (!_.isEmpty(rateDetail[15])) {
                newRateDetail.currency = {
                  _id: new ObjectId(rateDetail[15]),
                  name: rateDetail[16],
                };
              } else {
                newRateDetail.currency = null;
              }
              if (!_.isEmpty(rateDetail[11])) {
                newRateDetail.translationUnit = {
                  _id: new ObjectId(rateDetail[11]),
                  name: rateDetail[12],
                };
              } else {
                newRateDetail.translationUnit = null;
              }
              if (index === 0) {
                newRate = {
                  rateDetails: [newRateDetail],
                  sourceLanguage: {
                    name: '',
                    isoCode: '',
                  },
                  targetLanguage: {
                    name: '',
                    isoCode: '',
                  },
                };
                if (!_.isEmpty(rateDetail[3])) {
                  newRate.ability = {
                    _id: new ObjectId(rateDetail[3]),
                    name: rateDetail[4],
                  };
                }
                if (!_.isNil(sourceLanguage)) {
                  newRate.sourceLanguage = _.pick(sourceLanguage, ['name', 'isoCode']);
                } else {
                  newRate.sourceLanguage = null;
                }
                if (!_.isNil(targetLanguage)) {
                  newRate.targetLanguage = _.pick(targetLanguage, ['name', 'isoCode']);
                } else {
                  newRate.targetLanguage = null;
                }
                if (!_.isNil(catTool)) {
                  newRate.catTool = catTool;
                }
                if (!_.isEmpty(rateDetail[5])) {
                  newRate.company = {
                    _id: new ObjectId(rateDetail[5]),
                    name: rateDetail[6],
                  };
                } else {
                  newRate.company = null;
                }
                if (!_.isEmpty(rateDetail[17])) {
                  newRate.internalDepartment = {
                    _id: new ObjectId(rateDetail[17]),
                    name: rateDetail[18],
                  };
                } else {
                  newRate.internalDepartment = null;
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
              const existingRate = rates.find(r =>
                _.get(r, 'sourceLanguage.isoCode', '').toString() === _.get(newRate, 'sourceLanguage.isoCode', '').toString() &&
                _.get(r, 'targetLanguage.isoCode', '').toString() === _.get(newRate, 'targetLanguage.isoCode', '').toString() &&
                _.get(r, 'ability._id', '').toString() === _.get(newRate, 'ability', '').toString(),
              );
              if (_.isNil(existingRate)) {
                rates.push(newRate);
              } else {
                existingRate.rateDetails.push(newRate.rateDetails);
              }
            }
          }
          if (!_.isEmpty(rates)) {
            console.log(`Updating rates for user with id ${userId}`);
            await usersCol.updateOne({ _id: new ObjectId(userId) }, {
              $set: {
                'vendorDetails.rates': rates,
              },
            });
          }
        } catch (error) {
          console.log(`Failed with error ${error}`);
        }
      });
    const parser = csvParse({ delimiter: ',' }, (err, data) => {
      const vendorRates = _.groupBy(data, (r, index) => {
        if (index !== 0) {
          return r[0];
        }
      });
      let i = 0;

      async.eachSeries(vendorRates, (row, callback) => {
        if (i > 0) {
          const groupedRates = _.chain(row).filter(item => item).groupBy(item => `${item[0]}-${item[3]}-${item[7]}-${item[8]}`).value();
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
