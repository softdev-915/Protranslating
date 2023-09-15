const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const activityCompetenceUpdateEmail = {
  name: 'competence-audit-update',
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
    <p><strong><ins>COMPETENCE AUDIT UPDATE</ins></strong><p>
    A Competence Audit record was updated, please review the information below:<br>
    <p>Date Created: {{activity.createdAt}}</p>
    <p>Created By:  {{activity.createdBy}} </p>
    <p>Vendor:  {{#each activity.users}}{{name}},{{/each}} </p>
    <p>Subject:  {{activity.subject}} </p>
    <p>Body:  {{activity.comments}} </p>
    <p>Status:  {{activity.status}} </p>
    <p>Last Modified:{{activity.updatedAt}} </p>
    <p>Last Modified By: {{activity.updatedBy}} </p>
    <p>Tags:  {{activity.tags}} </p>
    <a href="{{path}}activities/{{activity._id}}/details" target="_blank">Go to the Activity</a><br>
    `,
    subject: ' Activity Updated - {{activity.subject}}',
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
        createdAt: 'Date Created',
        status: 'Activity status',
        subject: 'Activity subject',
        comments: 'Activity body',
        tags: 'Activity tags',
        updatedAt: 'Last modified',
        updatedBy: 'Last Modified By',
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
            const schedulerToInsert = Object.assign({}, activityCompetenceUpdateEmail);
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
