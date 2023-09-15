const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const externalAPIS = db.collection('external_apis');
  const recaptcha = { name: 'recaptcha-v3', options: { secret: '6Leio5wmAAAAAIupPrsVez2Sc7lIH-ldlI99-Bje' } };
  await externalAPIS.updateOne({
    name: recaptcha.name,
  }, {
    $set: recaptcha,
  }, { upsert: true });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
