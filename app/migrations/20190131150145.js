const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const company = db.collection('companies');
    return company.updateMany(
      { serviceAgreement: { $exists: false } },
      { $set: { serviceAgreement: false } },
    ).then(() => company.updateMany(
      { internalDepartments: { $exists: false } },
      { $set: { internalDepartments: [] } },
    ));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
