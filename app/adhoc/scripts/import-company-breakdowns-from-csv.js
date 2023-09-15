const { Types: { ObjectId } } = require('mongoose');
const async = require('async');
const _ = require('lodash');
const csvParse = require('csv-parse');
const fs = require('fs');
const mongo = require('../../components/database/mongo');
const configuration = require('../../components/configuration');

mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    const companiesCol = db.collection('companies');
    let csvRates = [];
    let companyId = '';
    const inputFile = `${__dirname}/companies-with-fuzzies.csv`;
    const updateDb = async (row, columns) => {
      columns.forEach((c, index) => {
        row[c] = row[index];
      });
      let hasRatesModified = false;
      if (companyId === '') {
        companyId = row['Company ID'];
      }
      if (companyId === row['Company ID']) {
        csvRates.push(row);
      } else {
        return companiesCol.findOne({
          _id: new ObjectId(companyId),
        }, { name: 1, billingInformation: 1 })
          .then((company) => {
            let rates = company.billingInformation.rates;
            rates = rates.map((r) => {
              r.rateDetails.forEach((rDetail) => {
                csvRates.forEach((rd) => {
                  if (rd.Ability === r.ability && _.get(r, 'sourceLanguage.isoCode', '') === rd['Source language']
                  && _.get(r, 'targetLanguage.isoCode', '') === rd['Target language']) {
                    if (!_.isEmpty(rDetail.translationUnit) && rDetail.translationUnit.toString() === rd['Translation Unit Id'] &&
                      !_.isEmpty(rDetail.internalDepartment) && rDetail.internalDepartment.toString() === rd['Internal Department Id'] &&
                      !_.isEmpty(rDetail.currency) && rDetail.currency.toString() === rd['Currency Id'] &&
                      rDetail.price === _.toNumber(rd.Price)) {
                      if (companyId === company._id.toString() && !_.isEmpty(rd['Breakdown Id'])) {
                        hasRatesModified = true;
                        rDetail.breakdown = new ObjectId(rd['Breakdown Id']);
                      }
                    }
                  }
                });
              });
              return r;
            });

            if (hasRatesModified && !_.isEmpty(rates)) {
              hasRatesModified = false;
              console.log(`Updating company ${company.name}`);
              return companiesCol.updateOne({ _id: company._id }, {
                $set: {
                  'billingInformation.rates': rates,
                },
              }).then(() => {
                console.log(`Company ${company.name} was updated`);
                csvRates = [row];
                companyId = '';
              });
            }
            csvRates = [row];
            companyId = '';
          });
      }
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
          updateDb(row, columns).then(callback);
        }
      });
    });
    return fs.createReadStream(inputFile).pipe(parser);
  });
