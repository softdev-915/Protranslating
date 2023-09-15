const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const companies = db.collection('companies');
    return companies.find({}).toArray()
      .then(companyList => (
        Promise.mapSeries(companyList, company => (
          companies.updateOne({
            _id: company._id,
          }, {
            $set: {
              onHoldText: _.get(company, 'billingInformation.onHold', '').toString(),
              grossProfitText: _.get(company, 'billingInformation.grossProfit', '').toString(),
              purchaseOrderRequiredText: _.get(company, 'billingInformation.purchaseOrderRequired', '').toString(),
            },
          })
        ))
      ));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
