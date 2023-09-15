const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const usersCol = db.collection('users');
    const internalDepartmentsCol = db.collection('internalDepartments');
    return internalDepartmentsCol.find().toArray()
      .then(intDepList => usersCol.find().toArray()
        .then(usersList => Promise.mapSeries(usersList, (user) => {
          const internalDepartmentsIds = _.get(user, 'vendorDetails.internalDepartments') ||
              _.get(user, 'staffDetails.internalDepartments', []);
          const internalDepartments = internalDepartmentsIds
            .map(iId => intDepList.find(i => i._id.equals(iId)));
          return usersCol.updateOne({ _id: user._id }, {
            $set: {
              internalDepartmentsText: internalDepartments
                .map(i => _.get(i, 'name', '')).join(', '),
            },
          });
        })),
      );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
