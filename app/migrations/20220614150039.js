const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then((connections) => {
    const lmsAuthCol = connections.mongooseAuth.collection('lmsAuth');

    return lmsAuthCol.getIndexes()
      .then((indexesNames) => {
        if (Object.keys(indexesNames).indexOf('lspId_1_email_1') >= 0) {
          return lmsAuthCol.dropIndex('lspId_1_email_1');
        }
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
