const moment = require('moment');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const providerAvailabilityEmail = {
  name: 'provider-availability-email',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'support@protranslating.com',
    template: '<h4 style="line-height: 1;"><b><span style="font-family: &quot;Helvetica Neue&quot;;">Available for service</span></b></h4><p><br></p><p>Are you available to perform a service for Protranslating?</p><p><br></p><p>Request Number: {{providerPool.requestNo}}</p><p>Request Title: {{providerPool.requestTitle}}</p><p>Service Name: {{providerPoolLine.ability}}</p><p>Language pair: {{providerPool.srcLang.name}} - {{providerPoolLine.tgtLang.name}}</p>{{#if providerPool.requestCatTool}}<p>Cat Tool: {{providerPool.requestCatTool}}</p>{{/if}}{{#if providerPool.requestProjectManagers.length}}<p>Project Manager(s): {{#each providerPool.requestProjectManagers}} {{ username this }} {{/each}}</p>{{/if}}<p>Task Due Date: {{toTimezone providerPoolLine.taskDueDate \'America/New_York\' \'YYYY-MM-DD hh:mm A z\'}}</p><p><br></p><p>Let us know by clicking on the link below:</p><p><br></p><p><a href="{{path}}/provider-pools/{{providerPool.request}}" target="_blank" rel="noopener">Go to task details<br></p>',
    subject: 'Service availability: {{providerPool.requestNo}}',
    variables: {
      user: {
        _id: 'projectManagerId',
        email: 'provider-email@sample.com',
        firstName: 'First',
        middleName: 'Middle',
        lastName: 'Last',
      },
      path: 'https://portal.protranslating.com/',
      providerPool: {
        _id: 'providerPoolId',
        request: 'requestId',
        requestNo: 'R180101-1',
        requestTitle: 'A cool document to translate',
        requestCatTool: 'MemoQ',
        requestProjectManagers: {
          _id: 'projectManagerId',
          firstName: 'First',
          middleName: 'Middle',
          lastName: 'Last',
        },
      },
      providerPoolLine: {
        tgtLang: 'Spanish',
        ability: 'Translation',
        taskDueDate: moment.utc().toDate(),
      },
    },
  },
};

const insertIfMissing = (schedulers, schedulerProspect) =>
  schedulers.findOne({ name: schedulerProspect.name })
    .then((scheduler) => {
      if (!scheduler) {
        return schedulers.insert(schedulerProspect);
      }
      return schedulers.update({ name: schedulerProspect.name }, { $set: schedulerProspect });
    });

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const schedulers = db.collection('schedulers');
    return insertIfMissing(schedulers, providerAvailabilityEmail);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
