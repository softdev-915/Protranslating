const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const activityTagsCol = db.collection('activityTags');
    const catToolCol = db.collection('catTool');
    const competenceLevelsCol = db.collection('competenceLevels');
    const currenciesCol = db.collection('currencies');
    const schedulersCol = db.collection('schedulers');
    return activityTagsCol.getIndexes().then((indexes) => {
      const nameIndex = Object.keys(indexes).find(i => i === 'name_1');
      if (nameIndex) {
        return activityTagsCol.dropIndex('name_1');
      }
    })
      .then(() =>
        catToolCol.getIndexes().then((indexes) => {
          const nameIndex = Object.keys(indexes).find(i => i === 'name_1');
          if (nameIndex) {
            return catToolCol.dropIndex('name_1');
          }
        }),
      )
      .then(() =>
        competenceLevelsCol.getIndexes().then((indexes) => {
          const nameIndex = Object.keys(indexes).find(i => i === 'name_1');
          if (nameIndex) {
            return competenceLevelsCol.dropIndex('name_1');
          }
        }),
      )
      .then(() =>
        currenciesCol.getIndexes().then((indexes) => {
          const nameIndex = Object.keys(indexes).find(i => i === 'name_1');
          if (nameIndex) {
            return currenciesCol.dropIndex('name_1');
          }
        }),
      )
      .then(() =>
        schedulersCol.getIndexes().then((indexes) => {
          const nameIndex = Object.keys(indexes).find(i => i === 'name_1');
          if (nameIndex) {
            return schedulersCol.dropIndex('name_1');
          }
        }),
      );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
