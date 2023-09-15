const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const connection = await connections.mongoose.connection;
  const usersCol = connection.collection('users');
  const cursor = await usersCol.find({ 'vendorDetails.escalated': { $exists: true } });
  /* eslint-disable no-await-in-loop */
  while (await cursor.hasNext()) {
    const user = await cursor.next();
    const escalated = _.get(user, 'vendorDetails.escalated');
    if (escalated.toString() !== user.escalatedText) {
      await usersCol.updateOne({ _id: user._id },
        { $set: { escalatedText: escalated.toString() } });
    }
  }
};

if (require.main === module) {
  migration()
    .then(() => process.exit(0))
    .catch((error) => {
      throw error;
    });
} else {
  module.exports = migration;
}
