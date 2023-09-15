const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const schedulers = db.collection('schedulers');
    return schedulers.findOneAndUpdate({ name: 'service-to-do-provider-notification' }, { $set: { 'email.template': "\n<h1>Service To Do </h1>\n    <strong><ins>You have a service to do for {{enterprise}}</ins></strong><br><br>\n    <p style=\"text-indent: 1em;\">Request Title:  {{request.title}} </p>\n\n    <p style=\"text-indent: 1em;\">Request Number:  {{request.no}} </p>\n    <p style=\"text-indent: 1em;\">Document Name:  {{request.documentNames}} </p>\n    <p style=\"text-indent: 1em;\">{{task.units}}</p>\n    <p style=\"text-indent: 1em;\">Service Name:  {{task.ability}} </p>\n    <p style=\"text-indent: 1em;\">Language pair(s):  {{task.languagePair}} </p>\n    <p style=\"text-indent: 1em;\">Delivery date:  {{toTimezone task.deliveryDate 'America/New_York' 'YYYY-MM-DD hh:mm A z'}} </p>\n    <a href=\"{{path}}\">Go to the service</a><br>\n" } });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
