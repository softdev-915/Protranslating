const Promise = require('bluebird');
const _ = require('lodash');
const mongo = require('../components/database/mongo');

const POSSIBLE_LSP_REFS = ['lspId', 'lsp'];
const migration = async () => {
  const schemas = await mongo.loadSchemas();
  await Promise.map(Object.values(schemas), async ({ collection, schema }) => {
    if (!_.has(schema.paths, 'externalId')) {
      return;
    }
    const lspRef = POSSIBLE_LSP_REFS.find(ref => _.has(schema.paths, ref));
    if (_.isEmpty(lspRef)) {
      return;
    }
    const indexes = await collection.getIndexes();
    if (_.has(indexes, `${lspRef}_1_externalId_1`)) {
      return;
    }
    await collection.updateMany({ externalId: '' }, {
      $unset: { externalId: 1 },
    });
    if (_.has(indexes, 'externalId_1')) {
      await collection.dropIndex('externalId_1');
    }
    await collection.createIndex({ [lspRef]: 1, externalId: 1 }, {
      unique: true,
      partialFilterExpression: {
        externalId: { $exists: true },
      },
    });
  });
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
