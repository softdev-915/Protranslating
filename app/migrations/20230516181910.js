const Promise = require('bluebird');
const _ = require('lodash');
const { Types: { ObjectId } } = require('mongoose');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const abilities = [
  {
    name: 'CAT Preflight',
    glAccountNo: 12345,
    languageCombination: false,
    competenceLevelRequired: false,
  },
  {
    name: 'PEMT',
    glAccountNo: 12345,
    languageCombination: true,
    competenceLevelRequired: true,
  },
];
const catTool = 'PortalCAT';
const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const lspCollection = db.collection('lsp');
  const lspIds = await lspCollection.distinct('_id');
  const abilityCollection = db.collection('abilities');
  const catToolCollection = db.collection('catTool');

  await Promise.map(lspIds, (async (lspId) => {
    const lspObjectId = new ObjectId(lspId);
    await Promise.map(abilities, (async (ability) => {
      const existingAbility = await abilityCollection.findOne({
        lspId: lspObjectId,
        name: ability.name,
      });
      if (_.isNil(existingAbility)) {
        await abilityCollection.insertOne({
          lspId: lspObjectId,
          catTool: true,
          companyRequired: false,
          internalDepartmentRequired: false,
          deleted: false,
          description: '',
          system: true,
          ...ability,
        });
      }
    }));

    await catToolCollection.updateOne(
      {
        lspId: lspObjectId,
        name: { $regex: new RegExp(`^${catTool}$`, 'ig') },
      },
      {
        $set: {
          lspId: lspObjectId,
          name: catTool,
          deleted: false,
        },
      },
      { upsert: true },
    );
  }));
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
