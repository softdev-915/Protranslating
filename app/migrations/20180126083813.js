const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const activityTags = [
  { name: 'Ability Added' },
  { name: 'Ability Removed' },
  { name: 'Feedback Received' },
  { name: 'Rate Increase' },
  { name: 'Rate Decrease' },
];

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const activityTagCollection = db.collection('activityTags');
    return Promise.map(activityTags, at => activityTagCollection.update(at, at, { upsert: true }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
