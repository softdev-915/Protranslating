const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const lsps = await db.collection('lsp').find().toArray();

  await Promise.each(lsps, async (lsp) => {
    const usdCurrency = await db.collection('currencies').findOne({ lspId: lsp._id, isoCode: 'USD' });
    if (!usdCurrency) {
      throw new Error(`USD Currency for lsp ${lsp._id} is not defined`);
    }
    await db.collection('companyMinimumCharges').updateMany(
      { lspId: lsp._id },
      { $set: { currency: { _id: usdCurrency._id, isoCode: usdCurrency.isoCode } } },
    );
  });

  // write your migration logic here.
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
