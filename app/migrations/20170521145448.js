const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const catTool = [
  { name: 'Ascribe' },
  { name: 'MemoQ' },
  { name: 'None' },
  { name: 'Trados' },
  { name: 'WebCATT' },
];

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const catToolCollection = db.collection('catTool');
    return Promise.all(catTool.map(ct => catToolCollection.update(ct, ct, { upsert: true })));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
