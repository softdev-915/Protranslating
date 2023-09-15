const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    const termsConditions = db.collection('termsConditions');
    const allTermsConditions = await termsConditions.find({}).toArray();
    if (allTermsConditions.length > 0) {
      const majorChanges = allTermsConditions.filter(tc => tc.minorVersion === 0);
      const nonMajorChanges = allTermsConditions.filter(tc => tc.minorVersion !== 0);
      await Promise.map(nonMajorChanges, (minorTc) => {
        const mcTc = majorChanges.find(tc => tc.majorVersion === minorTc.majorVersion);
        if (mcTc) {
          return termsConditions.update({ _id: minorTc._id },
            { $set: { majorVersionPublishDate: mcTc.validFrom } });
        }
      }, { concurrency: 1 });
    }
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
