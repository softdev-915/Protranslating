const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const companyExternalAccountingCodeCol = db.collection('companyExternalAccountingCodes');
  const companiesCol = db.collection('companies');
  let indexes = await companyExternalAccountingCodeCol.getIndexes();
  if (Object.keys(indexes).indexOf('lspId_1_company_1_companyExternalAccountingCode_1') > -1) {
    await companyExternalAccountingCodeCol.dropIndex('lspId_1_company_1_companyExternalAccountingCode_1');
  }
  const duplicateGroups = await companyExternalAccountingCodeCol.aggregate([
    {
      $group: {
        _id: {
          lspId: '$lspId',
          companyId: '$company._id',
          companyExternalAccountingCode: '$companyExternalAccountingCode',
        },
        duplicates: { $addToSet: '$_id' },
        count: { $sum: 1 },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
      },
    },
  ]).toArray();
  await Promise.mapSeries(duplicateGroups, async (group) => {
    const duplicates = group.duplicates.slice(1);
    await Promise.mapSeries(duplicates, duplicateId =>
      companyExternalAccountingCodeCol.deleteOne({ _id: duplicateId }),
    );
  });
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
  indexes = await companyExternalAccountingCodeCol.getIndexes();
  if (Object.keys(indexes).indexOf('lspId_1_company._id_1_companyExternalAccountingCode_1') < 0) {
    await companyExternalAccountingCodeCol.createIndex({
      lspId: 1,
      'company._id': 1,
      companyExternalAccountingCode: 1,
    }, { unique: true });
  }
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
