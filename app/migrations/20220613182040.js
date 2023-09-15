const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const logger = require('../components/log/logger');

const migration = () => mongo.connect(configuration)
  .then((connections) => {
    const usersCol = connections.mongoose.connection.collection('users');
    const lmsAuthCol = connections.mongooseAuth.collection('lmsAuth');
    const lmsAuthStream = lmsAuthCol
      .find({}).stream();

    return new Promise((resolve, reject) => {
      lmsAuthStream.on('end', resolve);
      lmsAuthStream.on('error', reject);
      lmsAuthStream.on('data', async (lmsAuth) => {
        lmsAuthStream.pause();
        if (lmsAuth.email && lmsAuth.lspId) {
          const userId = await usersCol.findOne({ email: lmsAuth.email, lsp: lmsAuth.lspId }, { _id: 1 });

          if (userId) {
            return lmsAuthStream.resume();
          }
        }
        try {
          await lmsAuthCol.remove({ _id: lmsAuth._id });
        } catch (err) {
          logger.error(`Delete lmsAuth ${lmsAuth._id} error : ${err.message}`);
        } finally {
          lmsAuthStream.resume();
        }
      });
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
