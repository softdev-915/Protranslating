const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const companyExternalAccountingCodeCol = db.collection('companyExternalAccountingCodes');
  const companiesCol = db.collection('companies');
  const accountingCodes = await companyExternalAccountingCodeCol.find({}).toArray();
  await Promise.mapSeries(accountingCodes, async (accountingCode) => {
    const company = await companiesCol.findOne({ _id: accountingCode.company._id });
    if (company.name !== accountingCode.company.name) {
      await companyExternalAccountingCodeCol.updateOne(
        { _id: accountingCode._id },
        { $set: { 'company.name': company.name } },
        { timestamps: false },
      );
    }
  });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
