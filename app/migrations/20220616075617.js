const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const stdoutLogger = require('../components/log/stdout-logger');

const migration = () => mongo.connect(configuration)
  .then((connections) => {
    const companiesCol = connections.mongoose.connection.collection('companies');
    const companiesStream = companiesCol.find({ 'parentCompany._id': { $exists: true }, 'ssoSettings.isSSOEnabled': true }, { _id: 1, name: 1 }).stream();
    return new Promise((resolve, reject) => {
      companiesStream.on('end', resolve);
      companiesStream.on('error', reject);
      companiesStream.on('data', ({ _id, name }) => {
        companiesStream.pause();
        companiesCol
          .updateOne({ _id: mongo.mongoose.Types.ObjectId(_id) },
            { $set: { areSsoSettingsOverwritten: true } })
          .then(() => {
            companiesStream.resume();
          })
          .catch((err) => {
            stdoutLogger.error(`Update lms for company ${name} error : ${err.message}`);
            companiesStream.resume();
          });
      });
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
