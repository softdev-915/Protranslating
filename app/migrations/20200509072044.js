const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const addUserIdentity = (user, lmsAuth) =>
  Promise.resolve().then(() =>
    lmsAuth.insert({
      lspId: user.lsp,
      email: user.email,
    }).catch(() => Promise.resolve()),
  );

const migration = () => mongo.connect(configuration)
  .then((connections) => {
    const usersCol = connections.mongoose.connection.collection('users');
    const lmsAuthCol = connections.mongooseAuth.collection('lmsAuth');
    const userStream = usersCol.find({}, { _id: 1, email: 1, lsp: 1 }).stream();
    return new Promise((resolve, reject) => {
      userStream.on('end', resolve);
      userStream.on('error', reject);
      userStream.on('data', (user) => {
        userStream.pause();
        if (_.isNil(user.lsp)) {
          userStream.resume();
        } else {
          addUserIdentity(user, lmsAuthCol).then(() => userStream.resume());
        }
      });
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
