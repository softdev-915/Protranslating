const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const envConfig = configuration.environment;
const password = '$2b$12$pKvq.hnSXE93VuzMRmhVBeQmyb67lfTZq9.PH.dhvaAlCzbMJQaXW';
const migration = () => mongo.connect(configuration)
  .then(async (connections) => {
    const db = connections.mongoose.connection;
    const usersCol = db.collection('users');
    const lmsAuthCol = connections.mongooseAuth.collection('lmsAuth');
    if (envConfig.NODE_ENV === 'PROD') {
      return Promise.resolve();
    }
    const testUsers = await usersCol.find({ email: /sample.com|testing.com/ }, '_id email lsp').toArray();
    await Promise.map((testUsers), async (user) => {
      const userAuth = {
        email: user.email,
        lspId: user.lsp,
        passwordChangeDate: new Date(),
        password,
      };
      await lmsAuthCol.updateOne(
        { email: user.email, lspId: user.lsp },
        { $set: userAuth },
        { upsert: true });
      await usersCol.updateOne(
        { _id: user._id },
        { $set: {
          isApiUser: true,
        } },
        { upsert: false });
    }, { concurrency: 50 });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
