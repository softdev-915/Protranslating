const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    let collectionNames = await db.db.listCollections().toArray();
    collectionNames = collectionNames.map(({ name }) => name);
    const gridsCol = collectionNames.includes('grids') ? db.collection('grids') : null;
    const catToolCol = collectionNames.includes('catTool') ? db.collection('catTool') : null;
    const userToastsCol = collectionNames.includes('userToasts') ? db.collection('userToasts') : null;
    if (!_.isNil(gridsCol)) {
      const gridsIndexes = await gridsCol.getIndexes();
      if (Object.keys(gridsIndexes).indexOf('lspId_1') >= 0) {
        await gridsCol.dropIndex('lspId_1');
      }
    }
    if (!_.isNil(catToolCol)) {
      const catToolIndexes = await catToolCol.getIndexes();
      if (Object.keys((catToolIndexes)).indexOf('lspId_1') >= 0) {
        await catToolCol.dropIndex('lspId_1');
      }
    }
    if (!_.isNil(userToastsCol)) {
      const userToastsIndexes = await userToastsCol.getIndexes();
      const indexesNames = Object.keys(userToastsIndexes);
      const indexesToRemove = ['lspId_1', 'lspId_1_user_1', 'lspId_1_user_1_from_1_to_1'];
      await Promise.mapSeries(indexesToRemove, (index) => {
        if (indexesNames.includes(index)) {
          return userToastsCol.dropIndex(index);
        }
      });
    }
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
