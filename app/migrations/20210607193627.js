const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const usersCol = db.collection('users');
    const companiesCol = db.collection('companies');
    return Promise.all([
      usersCol.find({ 'siConnector.connectorStartedAt': { $type: 'string' } }).toArray()
        .then(users => Promise.map(users,
          u => usersCol.updateOne({ _id: u._id }, { $set: { 'siConnector.connectorStartedAt': new Date(u.siConnector.connectorStartedAt) } }))),
      companiesCol.find({ 'siConnector.connectorStartedAt': { $type: 'string' } }).toArray()
        .then(companies => Promise.map(companies,
          c => companiesCol.updateOne({ _id: c._id }, { $set: { 'siConnector.connectorStartedAt': new Date(c.siConnector.connectorStartedAt) } }))),
    ]);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
