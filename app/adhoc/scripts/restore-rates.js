const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { Types: { ObjectId } } = require('mongoose');
const mongo = require('../../components/database/mongo');
const configuration = require('../../components/configuration');

mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    const companyFilePath = _.get(process, 'argv[2]');
    if (!companyFilePath) {
      throw new Error('Path to company file is not specified');
    }
    const fullPath = path.resolve(__dirname, companyFilePath);
    const company = JSON.parse(fs.readFileSync(fullPath));
    if (!company._id || _.isEmpty(company.billingInformation.rates)) {
      throw new Error('Invalid company');
    }
    const companyColl = db.collection('companies');
    const companyDoc = await companyColl.findOne({ _id: new ObjectId(company._id) });
    if (!companyDoc) {
      throw new Error(`Company with id ${company._id} not found`);
    }
    if (!_.isEmpty(companyDoc.billingInformation.rates)) {
      throw new Error(`Company with id ${company._id} already has not empty rates`);
    }
    await companyColl.updateOne({ _id: companyDoc._id }, { $set: { 'billingInformation.rates': company.billingInformation.rates } });
  })
  .catch(e => console.log(e))
  .finally(process.exit);
