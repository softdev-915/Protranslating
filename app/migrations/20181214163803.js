const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const addAbilityLspId = (collection, ability, lsp) => {
  if (!ability.lspId) {
    return collection.updateOne({
      _id: ability._id,
      lspId: {
        $exists: false,
      },
    },
    {
      $set:
        {
          lspId: lsp._id,
        },
    },
    );
  }
  return Promise.resolve();
};

const addMissingAbility = (collection, ability, lsp) => {
  ability.lspId = lsp._id;
  return collection.findOne({
    name: ability.name,
    lspId: lsp._id,
  }).then((abilityFound) => {
    if (!abilityFound) {
      delete ability._id;
      return collection.insertOne(ability);
    }
    return Promise.resolve();
  });
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lspCol = db.collection('lsp');
    const abilitiesCol = db.collection('abilities');
    let lspList;
    // Get all LSP
    return lspCol.find({ $or: [{ name: 'Protranslating' }, { name: 'PTI' }] }).toArray()
      .then((lsps) => {
        lspList = lsps;
        // Get all abilities
        return abilitiesCol.find().toArray();
      }).then((abilities) => {
        if (lspList.length > 0) {
          const ptsLsp = lspList.find(lsp => lsp.name === 'Protranslating');
          const ptiLsp = lspList.find(lsp => lsp.name === 'PTI');
          // Iterate and add (if not found) each ability for both lsp
          const upsertPromises = [];
          if (abilities.length > 0) {
            abilities.forEach((ability) => {
              upsertPromises.push(() => addAbilityLspId(abilitiesCol, ability, ptsLsp));
              upsertPromises.push(() => addMissingAbility(abilitiesCol, ability, ptiLsp));
            });
            return Promise.mapSeries(upsertPromises, upsertPromise => upsertPromise());
          }
        }
        return Promise.resolve();
      });
  });
if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
