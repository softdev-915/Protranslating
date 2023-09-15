const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const _ = require('lodash');
const Promise = require('bluebird');

const ncCcCategoryHeap = {
  'Billing Related': 'Billing Related (CC)',
  'Client Error': 'Client Error (CC)',
  'Conduct Related': 'Conduct Related (NC)',
  Delivery: 'Delivery (CC)',
  'Process Related': 'Process Related (NC)',
  Quality: 'Quality (CC)',
  'Resource Needed': 'Resource Needed (NC)',
  Timeliness: 'Timeliness (CC)',
  'Training Required': 'Training Required (NC)',
  'Vendor Error': 'Vendor Error (CC)',
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const activities = db.collection('activities');
    const queries = _.keys(ncCcCategoryHeap).map(original =>
      (() => activities.updateMany({ 'feedbackDetails.nonComplianceClientComplaintCategory': original },
        { $set: { 'feedbackDetails.nonComplianceClientComplaintCategory': ncCcCategoryHeap[original] } })));
    return Promise.mapSeries(queries, f => f());
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
