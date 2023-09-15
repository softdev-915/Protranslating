const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const isOverwritten = true;
const checkMinimumPasswordLength = false;
const insertCheckInheritance = (usersCol, user) => usersCol.updateOne({ _id: user._id }, {
  $set: {
    isOverwritten,
    checkMinimumPasswordLength,
  },
});

const migration = () => mongo.connect(configuration)
  .then((connections) => {
    const usersCol = connections.mongoose.connection.collection('users');
    const userStream = usersCol.find().stream();
    return new Promise((resolve, reject) => {
      userStream.on('end', resolve);
      userStream.on('error', reject);
      userStream.on('data', (user) => {
        userStream.pause();
        insertCheckInheritance(usersCol, user).then(() => userStream.resume());
      });
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
