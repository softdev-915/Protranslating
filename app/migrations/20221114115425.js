const { loadSchemas } = require('../components/database/mongo');
const _ = require('lodash');

const migration = async () => {
  const schemas = await loadSchemas();
  const requestIndexes = await schemas.Request.collection.getIndexes();
  if (_.has(requestIndexes, 'externalId_1')) {
    await schemas.Request.collection.dropIndex('externalId_1');
  }
  if (_.has(requestIndexes, 'externalId_1_lspId_1')) {
    await schemas.Request.collection.dropIndex('externalId_1_lspId_1');
  }
  const externalApiIndexes = await schemas.ExternalApi.collection.getIndexes();
  if (_.has(externalApiIndexes, 'name_1')) {
    await schemas.ExternalApi.collection.dropIndex('name_1');
  }
  const currencyIndexes = await schemas.Currency.collection.getIndexes();
  if (_.has(currencyIndexes, 'name_1_isoCode_1_lspId_1')) {
    await schemas.Currency.collection.dropIndex('name_1_isoCode_1_lspId_1');
  }
  if (!_.has(currencyIndexes, 'name_1_lspId_1')) {
    await schemas.Currency.collection.createIndex({ name: 1, lspId: 1 }, { unique: true });
  }
  if (!_.has(currencyIndexes, 'isoCode_1_lspId_1')) {
    await schemas.Currency.collection.createIndex({ isoCode: 1, lspId: 1 }, { unique: true });
  }
};

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
