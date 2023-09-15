const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const groupsCol = db.collection('groups');
    let ptiLsp;
    let ptsLsp;
    return lspCol.find({ $or: [{ name: 'Protranslating' }, { name: 'PTI' }] }).toArray()
      .then((lspList) => {
        ptsLsp = lspList.find(l => l.name === 'Protranslating');
        ptiLsp = lspList.find(l => l.name === 'PTI');
        return groupsCol.find({ lspId: ptsLsp._id }, { _id: 0 }).toArray();
      })
      .then((ptsGroups) => {
        const newGroups = ptsGroups.map((g) => {
          delete g._id;
          g.lspId = ptiLsp._id;
          return g;
        });
        return Promise.mapSeries(newGroups, g =>
          groupsCol.findOne({ name: g.name, lspId: ptiLsp._id })
            .then((dbGroup) => {
              if (!dbGroup) {
                return groupsCol.insertOne(g);
              }
              return Promise.resolve();
            }),
        );
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
