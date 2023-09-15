const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const envConfig = configuration.environment;
const addUserToLsp = async (db, userEmail, lspId) => {
  const usersCol = db.collection('users');
  const groupsCol = db.collection('groups');
  const lspCol = db.collection('lsp');
  return usersCol.findOne({
    email: userEmail,
    lsp: lspId,
  })
    .then(user =>
      lspCol.findOne({ name: 'US Bank' }).then(usBank =>
        groupsCol.findOne({ name: 'LSP_ADMIN', lspId: usBank._id }).then((group) => {
          if (!group) {
            throw new Error('PTI LMS_ADMIN group was not found');
          }
          return usersCol.findOne({
            email: user.email,
            lsp: usBank._id,
          }).then((userFound) => {
            if (!userFound) {
              delete user._id;
              user.groups = [group];
              user.lsp = usBank._id;
              return usersCol.insertOne(user);
            }
            return Promise.resolve();
          });
        }),
      ),
    );
};

const insertUsers = async (connections, newUsers, environment) => {
  const users = environment === 'PROD' ? newUsers.prodUsers : newUsers.testUsers;
  const db = connections.mongoose.connection;
  const lspCol = db.collection('lsp');
  const lmsAuth = connections.mongooseAuth.collection('lmsAuth');
  const usersAuth = await lmsAuth.find({ email: { $in: users } }).toArray();
  const lspList = await lspCol.find({ name: { $in: ['US Bank', 'Protranslating'] } }).toArray();
  return Promise.mapSeries((users), async (user) => {
    const pts = lspList.find(l => l.name === 'Protranslating');
    const usBank = lspList.find(l => l.name === 'US Bank');
    const userAuth = _.defaultTo(usersAuth.find(a => a.email === user), {});
    _.unset(userAuth, '_id');
    userAuth.lspId = usBank._id;
    await lmsAuth.updateOne(
      { email: user, lspId: userAuth.lspId },
      { $set: userAuth },
      { upsert: true });
    return addUserToLsp(db, user, pts._id);
  });
};
const prodUsers = ['ptzankova@protranslating.com', 'nurquiza@protranslating.com'];
const testUsers = ['e2e@sample.com'];
const migration = () => mongo.connect(configuration)
  .then(connections =>
    insertUsers(connections, { prodUsers, testUsers }, envConfig.NODE_ENV),
  );

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
