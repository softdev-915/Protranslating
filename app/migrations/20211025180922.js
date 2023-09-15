const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  // write your migration logic here.
  const arInvoicesColStream = db.collection('arInvoices').find().stream();
  return new Promise((resolve, reject) => {
    arInvoicesColStream.on('end', resolve);
    arInvoicesColStream.on('error', reject);
    arInvoicesColStream.on('data', async (arInvoice) => {
      arInvoicesColStream.pause();
      if (!_.isNil(arInvoice.contact._id) && !_.isNil(arInvoice.company._id)) {
        await db.collection('arInvoices').findOneAndUpdate({ _id: arInvoice._id }, {
          $set: {
            company: arInvoice.company._id,
            contact: arInvoice.contact._id,
          },
        });
      }
      arInvoicesColStream.resume();
    });
  });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
