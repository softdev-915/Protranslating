const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const logger = require('../components/log/logger');

const migration = () => mongo.connect(configuration)
  .then((connections) => {
    const usersCol = connections.mongoose.connection.collection('users');
    const lmsAuthCol = connections.mongooseAuth.collection('lmsAuth');
    const userStream = usersCol.find({ email: { $exists: true }, lsp: { $exists: true } }).stream();

    return new Promise((resolve, reject) => {
      userStream.on('end', resolve);
      userStream.on('error', reject);
      userStream.on('data', (user) => {
        userStream.pause();
        lmsAuthCol
          .updateOne({ email: user.email, lspId: user.lsp }, { $set: { userId: user._id } })
          .then(() => {
            userStream.resume();
          })
          .catch((err) => {
            logger.error(`Update lmsAuth for user ${user.email} error : ${err.message}`);
            userStream.resume();
          });
      });
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
