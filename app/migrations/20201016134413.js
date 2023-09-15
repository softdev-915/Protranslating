const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const envConfig = configuration.environment;
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const groupsCol = db.collection('groups');
    let bigEur;
    let ptsLsp;
    if (envConfig.NODE_ENV === 'PROD') {
      return Promise.resolve();
    }
    return lspCol.find({ $or: [{ name: 'Protranslating' }, { name: 'BIG-LS EUR' }] }).toArray()
      .then((lspList) => {
        ptsLsp = lspList.find(l => l.name === 'Protranslating');
        bigEur = lspList.find(l => l.name === 'BIG-LS EUR');
        return groupsCol.find({ lspId: ptsLsp._id }, { _id: 0 }).toArray();
      })
      .then((ptsGroups) => {
        const newGroups = ptsGroups.map((g) => {
          delete g._id;
          g.lspId = bigEur._id;
          return g;
        });
        return Promise.mapSeries(newGroups, g =>
          groupsCol.findOne({ name: g.name, lspId: bigEur._id })
            .then((dbGroup) => {
              if (_.isNil(dbGroup)) {
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
