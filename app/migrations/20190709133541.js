const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const serviceToDoProviderNotificationPTS = {
  name: 'service-to-do-provider-notification',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'notify@protranslating.com',
    template: '<h1>Service To Do </h1>\n    <strong><ins>You have a service to do for {{enterprise}}</ins></strong><br><br>\n    <p style="text-indent: 1em;">Request Title:  {{request.title}} </p>\n\n    <p style="text-indent: 1em;">Request Number:  {{request.no}} </p>\n    <p style="text-indent: 1em;">Document Name:  {{request.documentNames}} </p>\n    <p style="text-indent: 1em;">{{task.units}}</p>\n    <p style="text-indent: 1em;">Service Name:  {{task.ability}} </p>\n    <p style="text-indent: 1em;">Language pair(s):  {{task.languagePair}} </p>\n    <p style="text-indent: 1em;">Delivery date:  {{toTimezone task.deliveryDate  \'America/New_York\' \'YYYY-MM-DD hh:mm A z\'}} </p>\n    <a href="{{path}}">Go to the service</a><br>\n',
    subject: 'Service Summary: {{request.no}}',
    variables: {
      path: 'https://www.protranslating.com',
      user: {
        _id: '456',
        firstName: 'User',
        middleName: 'Middle',
        lastName: 'Receiver',
      },
      request: {
        no: 'ACME-1234-5',
        documentNames: 'files',
      },
      task: {
        units: '10 Reps',
        ability: 'Ability',
        languagePair: 'English - Spanish',
        deliveryDate: new Date(),
      },
      enterprise: 'ProTranslating',
    },
  },
  deleted: false,
};

const insertIfMissing = (schedulers, lsp, schedulerData) => schedulers.findOne({
  name: schedulerData.name,
  lspId: lsp._id,
}).then((scheduler) => {
  schedulerData.lspId = lsp._id;
  if (!scheduler) {
    return schedulers.insert(schedulerData);
  }
  return schedulers.updateOne({ _id: scheduler._id }, { $set: schedulerData });
});

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const schedulers = db.collection('schedulers');
    const lsp = db.collection('lsp');
    const schedulerPromises = [];
    return lsp.findOne({ name: 'Protranslating' })
      .then((l) => {
        schedulerPromises.push(() =>
          insertIfMissing(schedulers, l, serviceToDoProviderNotificationPTS),
        );
        schedulerPromises.push(() => schedulers.remove({
          name: 'service-to-do-provider-consecutive',
          lspId: l._id,
        }));
        schedulerPromises.push(() => schedulers.remove({
          name: 'service-to-do-provider-conference',
          lspId: l._id,
        }));
        return Promise.mapSeries(schedulerPromises, promise => promise());
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
