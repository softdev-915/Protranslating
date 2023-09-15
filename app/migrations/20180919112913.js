const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const newActivityTags = [{ name: 'Ability Added' }, { name: 'Rate Increase' }, { name: 'Rate Decrease' }, { name: 'Ability Removed' },
      { name: 'Competence Audit' }, { name: 'Feedback Received' }, { name: 'Escalation 1' },
      { name: 'Escalation 2' }, { name: 'Escalation Termination' }, { name: 'Escalation Bypass' },
      { name: 'Client Complaint' }, { name: 'Non-Conformance' }];
    const activityTags = db.collection('activityTags');
    const lsp = db.collection('lsp');
    const lspName = 'Protranslating';
    return lsp.findOne({ name: lspName })
      .then((protranslating) => {
        if (protranslating) {
          return Promise.mapSeries(newActivityTags, a =>
            activityTags.findOne({ name: a.name, lspId: protranslating._id })
              .then((dbActivityTag) => {
                if (dbActivityTag) {
                  return activityTags.update(
                    { name: a.name }, { $set: { lspId: protranslating._id } });
                }
                a.lspId = protranslating._id;
                return activityTags.insert(a);
              }));
        }
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
