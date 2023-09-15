const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const activityFeedbackCreateEmail = {
  name: 'user-feedback-create-for-auditor',
  lspId: 'lsp ID',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'support@protranslating.com',
    to: '{{user.email}}',
    template: `
    <p>Hello {{user.firstName}} {{user.lastName}}, </p><br>
    <p><strong><ins>FEEDBACK REVIEW REQUIRED</ins></strong><p>
    An Activity-Feedback submission has been created. Please review the information below:<br>
    <p>Users:  {{#each activity.users}}{{name}},{{/each}} </p>
    <p>Created By:  {{activity.createdBy}} </p>
    <p>Status:  {{activity.status}} </p>
    <p>Subject:  {{activity.subject}} </p>
    <p>Body:  {{activity.comments}} </p>
    <p>Tags:  {{activity.tags}} </p>
    <a href="{{path}}activities/{{activity._id}}/details" target="_blank">Go to the Activity</a><br>
    `,
    subject: ' Activity Created - {{activity.subject}}',
    variables: {
      path: 'https://portal.protranslating.com/',
      user: {
        fullName: 'Email Receiver',
        email: 'email-receiver@protranslating.com',
      },
      activity: {
        _id: 'activity-id',
        users: [{
          name: 'User name',
        }],
        createdBy: 'John Doe',
        status: 'Activity status',
        subject: 'Activity subject',
        comments: 'Activity body',
        tags: ['Activity\'s tag\'s'],
      },
    },
  },
};

const insertOrUpdate = (schedulers, activityEmail) =>
  schedulers.findOne({ name: activityEmail.name })
    .then((scheduler) => {
      if (!scheduler) {
        return schedulers.insertOne(activityEmail);
      }
      return schedulers.update({ name: activityEmail.name }, { $set: activityEmail });
    });

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const schedulers = db.collection('schedulers');
    return db.collection('lsp').find({ $or: [{ name: 'Protranslating' }, { name: 'PTI' }] }).toArray()
      .then((lsps) => {
        if (lsps && lsps.length) {
          return Promise.all(lsps.map((lsp) => {
            const schedulerToInsert = Object.assign({}, activityFeedbackCreateEmail);
            schedulerToInsert.lspId = lsp._id;
            return insertOrUpdate(schedulers, schedulerToInsert);
          }));
        }
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
