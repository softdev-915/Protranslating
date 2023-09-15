const Promise = require('bluebird');
const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const requests = db.collection('requests');
    const stream = requests.find({ otherCC: { $type: 'string' } }).stream();
    return new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
      stream.on('data', (r) => {
        stream.pause();
        let otherCC = r.otherCC;
        if (_.isString(r.otherCC) && !_.isEmpty(r.otherCC)) {
          otherCC = r.otherCC.split(' ');
        }
        requests.updateOne({ _id: r._id }, { $set: { otherCC } })
          .then(() => stream.resume());
      });
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
