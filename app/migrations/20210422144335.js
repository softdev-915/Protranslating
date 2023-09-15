const path = require('path');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    try {
      const paymentGateways = db.collection('paymentGateways');
      const cc = await paymentGateways.findOne({ name: 'Cybersource' });
      if (!cc) {
        await paymentGateways.insertOne({ name: 'Cybersource' });
      }
      await db.createCollection('ccPayments');
    } catch (e) {
      /* eslint-disable no-console */
      console.log(`Migration ${path.basename(__filename)} failed: ${e}`);
    }
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
