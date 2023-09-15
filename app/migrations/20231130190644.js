const Promise = require('bluebird');
const _ = require('lodash');
const { Types: { ObjectId } } = require('mongoose');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const newAbility = {
  name: 'QA',
  glAccountNo: 12345,
  languageCombination: true,
  competenceLevelRequired: false,
  catTool: true,
  companyRequired: false,
  internalDepartmentRequired: false,
  deleted: false,
  description: '',
  system: true,
};

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const lspCollection = db.collection('lsp');
  const lspIds = await lspCollection.distinct('_id');
  const abilityCollection = db.collection('abilities');

  await Promise.map(lspIds, (async (lspId) => {
    const lspObjectId = new ObjectId(lspId);
    const existingAbility = await abilityCollection.findOne({
      lspId: lspObjectId,
      name: newAbility.name,
    });
    if (_.isNil(existingAbility)) {
      await abilityCollection.insertOne({
        lspId: lspObjectId,
        ...newAbility,
      });
    }
  }));
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
