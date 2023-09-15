const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  // write your migration logic here.
  const arAdvancesColStream = db.collection('arAdvances').find().stream();
  return new Promise((resolve, reject) => {
    arAdvancesColStream.on('end', resolve);
    arAdvancesColStream.on('error', reject);
    arAdvancesColStream.on('data', async (arAdvance) => {
      arAdvancesColStream.pause();
      if (!_.isNil(arAdvance.company._id)) {
        await db.collection('arAdvances').findOneAndUpdate({ _id: arAdvance._id }, {
          $set: {
            company: arAdvance.company._id,
          },
        });
      }
      arAdvancesColStream.resume();
    });
  });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
