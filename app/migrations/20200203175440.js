const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const denormalizeCompetenceLevels = (request, competenceLevels) => {
  const requestCompetenceLevels = _.get(request, 'competenceLevels', []);
  return requestCompetenceLevels.map((reqComLvl) => {
    const compLevel = competenceLevels.find(c => c._id.equals(reqComLvl._id));
    if (compLevel) {
      return { _id: compLevel._id, name: compLevel.name };
    }
    return reqComLvl;
  });
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const requestsCol = db.collection('requests');
    const competenceLevelsCol = db.collection('competenceLevels');
    return competenceLevelsCol.find().toArray()
      .then(competenceLevels => requestsCol.find().toArray()
        .then((requests) => {
          requests = requests.map((request) => {
            request.competenceLevels = denormalizeCompetenceLevels(request, competenceLevels);
            return request;
          });
          return Promise.map(
            requests,
            request => requestsCol.updateOne(
              { _id: request._id },
              { $set: { competenceLevels: request.competenceLevels } },
            ),
            { concurrency: 10 },
          );
        }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
