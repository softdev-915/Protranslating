const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const taskOverdueNotificationPTS = {
  name: 'task-overdue-notification',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'notify@protranslating.com',
    template: '<h1>Task Overdue Notification</h1>\n <strong><ins>A task is overdue for Big Language Solutions.</ins></strong><br><br>\n <p style="text-indent: 1em;">Provider:  {{provider.name}} <a href="mailto:{{provider.email}}" target"_blank">{{provider.email}}</a> </p>\n <p style="text-indent: 1em;">Request Title:  {{request.title}} </p>\n <p style="text-indent: 1em;">Request Number:  {{request.no}} </p>\n <p style="text-indent: 1em;">Service Name:  {{task.ability}} </p>\n <p style="text-indent: 1em;">Language pair(s):  {{request.srcLang.name}} - {{request.tgtLang.name}} </p>\n <p style="text-indent: 1em;">Delivery date:  {{toTimezone task.taskDueDate  \'America/New_York\' \'YYYY-MM-DD hh:mm A z\'}} </p>\n <p style="text-indent: 1em;">Project Managers: {{#each projectManagers}} {{this.firstName}} {{this.lastName}} <a href="mailto:{{provider.email}}" target"_blank">{{this.email}}</a>, {{/each}} </p>\n <p style="text-indent: 1em;"><i>Note: This email is automatically generated, please do not reply to it. If you need to  speak to someone about your assignment, please contact the Project Manager(s) of the request!</i></p>\n',
    subject: 'Task Overdue: {{request.no}} - {{task.ability}} - {{toTimezone task.taskDueDate  \'America/New_York\' \'YYYY-MM-DD hh:mm A z\'}}',
    variables: {
      user: {
        _id: '456',
        firstName: 'User',
        middleName: 'Middle',
        lastName: 'Receiver',
      },
      request: {
        no: 'ACME-1234-5',
        title: 'Title',
        srcLang: {
          name: 'English',
          isoCode: 'ENG',
        },
        tgtLang: {
          name: 'Spanish',
          isoCode: 'SPA',
        },
      },
      task: {
        ability: 'Ability',
        taskDueDate: new Date(),
      },
      provider: {
        name: 'name',
        email: 'provider@gmail.com',
      },
      projectManagers: [{
        firstName: 'first name',
        lastName: 'last name',
        email: 'manager@gmail.com',
      }],
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
    return schedulers.insertOne(schedulerData);
  }
  return schedulers.updateOne({ _id: scheduler._id }, { $set: schedulerData });
});

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const schedulers = db.collection('schedulers');
    const lsp = db.collection('lsp');
    const schedulerPromises = [];
    return lsp.findOne({ name: 'Big Language Solutions' })
      .then((l) => {
        schedulerPromises.push(() =>
          insertIfMissing(schedulers, l, taskOverdueNotificationPTS),
        );
        return Promise.mapSeries(schedulerPromises, promise => promise());
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
