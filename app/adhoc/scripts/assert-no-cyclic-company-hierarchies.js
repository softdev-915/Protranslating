const _ = require('lodash');
const mongo = require('../../components/database/mongo');
const configuration = require('../../components/configuration');

mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then(async (db) => {
    const collection = db.collection('companies');
    const companies = await collection.find({}, { hierarchy: 1, name: 1, _id: 1 }).toArray();
    const cyclic = companies.filter((company) => {
      const hierarchy = _.get(company, 'hierarchy', '').split(':').map(h => h.trim());
      const uniqueHierarchies = _.uniq(hierarchy);
      return hierarchy.length !== uniqueHierarchies.size;
    });
    if (!_.isEmpty(cyclic)) {
      throw new Error('There are cyclic company hierarchies');
    }
  })
  .catch(e => console.log(e))
  .finally(process.exit);
