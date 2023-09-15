const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const serviceToDoScheduler = {
  name: 'service-to-do-staff-vendor-email',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'notify@protranslating.com',
    template: `
    <h1>Service To Do </h1>
    <strong><ins>You have a service to do for {{enterprise}}</ins></strong><br><br>
    <p style="text-indent: 1em;">Request Number:  {{request.no}} </p>
    <p style="text-indent: 1em;">Document Name:  {{request.documentNames}} </p>
    <p style="text-indent: 1em;">{{task.units}}</p>
    <p style="text-indent: 1em;">Service Name:  {{task.ability}} </p>
    <p style="text-indent: 1em;">Language pair(s):  {{task.languagePair}} </p>
    <p style="text-indent: 1em;">Delivery date:  {{task.deliveryDate}} </p>
    <a href="{{path}}">Go to the service</a><br>
    `,
    subject: 'Service Summary: {{request.no}}',
    variables: {
      path: 'https://www.protranslating.com',
      request: {
        no: 'ACME-1234-5',
        documentNames: 'files',
      },
      task: {
        units: '10 Reps',
        ability: 'Ability',
        languagePair: 'English - Spanish',
        deliveryDate: '2017-07-31 19:00',
      },
      enterprise: 'ProTranslating',
    },
  },
};

const insertIfMissing = (schedulers, request) => schedulers.findOne({ name: request.name })
  .then((scheduler) => {
    if (!scheduler) {
      return schedulers.insert(request);
    }
    return schedulers.update({ name: request.name }, { $set: request });
  });

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const schedulers = db.collection('schedulers');
    return insertIfMissing(schedulers, serviceToDoScheduler);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
