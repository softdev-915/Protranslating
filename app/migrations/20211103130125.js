/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const ApplicationCrypto = require('../components/crypto');

const { CRYPTO_KEY_PATH } = configuration.environment;
const applicationCrypto = new ApplicationCrypto(CRYPTO_KEY_PATH);
const encryptCollectionField = async (connection, schema, field) => {
  const collection = connection.collection(schema);
  const cursor = await collection.find({
    [field]: { $exists: true },
  });

  while (await cursor.hasNext()) {
    const document = await cursor.next();

    await collection.updateOne({ _id: document._id }, {
      $set: { [field]: applicationCrypto.encrypt(_.get(document, field)) },
    });
  }
};

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const connection = await connections.mongoose.connection;

  await encryptCollectionField(connection, 'users', 'vendorDetails.billingInformation.taxId');
};

if (require.main === module) {
  migration().then(() => process.exit(0));
} else {
  module.exports = migration;
}
