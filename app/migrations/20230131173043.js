const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const migration = () => mongo.connect(configuration)
  .then(({ mongoose }) => mongoose.connection)
  .then(async (db) => {
    const companies = db.collection('companies');
    await companies.updateMany(
      { allowCopyPasteInPortalCat: { $exists: false } },
      { $set: { allowCopyPasteInPortalCat: true } },
      { multi: true },
    );

    const allCompanies = await companies.find().toArray();
    const requests = db.collection('requests');
    await Promise.map(
      allCompanies,
      ({ _id, allowCopyPasteInPortalCat }) => requests.update(
        { 'company._id': _id, 'company.allowCopyPasteInPortalCat': { $exists: false } },
        { $set: { 'company.allowCopyPasteInPortalCat': allowCopyPasteInPortalCat } },
      ),
    );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => {
    throw err;
  });
} else {
  module.exports = migration;
}
