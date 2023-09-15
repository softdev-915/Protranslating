const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const contactUsNotification = {
  name: 'contact-us-notification',
  every: '1 minutes',
  options: {
    lockLifetime: 10000,
    priority: 'highest',
  },
  email: {
    from: 'support@protranslating.com',
    template: `
    <p><b>Name</b></p>
    <p>{{form.name}}</p>
    <p><b>Email</b></p>
    <p>{{form.email}}</p> 
    <p><b>I am a</b></p>
    <p>{{form.userType}}</p>
    <p><b>Company Name</b></p>
    <p>{{form.companyName}}</p>
    <p><b>LSP</b></p>
    <p>{{form.lsp.name}}</p>
    <p><b>Comment</b></p>
    <p>{{form.comment}}</p>
    <p><b>Files</b></p>
    {{#each form.files}}
      <a href="{{url}}">{{name}}</a>
    {{/each}}
`,
    subject: 'New contact us form has been submitted',
    variables: {
      form: {
        name: 'Name',
        email: 'Email',
        userType: 'I am a Client',
        companyName: 'Company Name',
        lsp: {
          name: 'LSP Name',
        },
        comment: 'Comment',
        files: [{
          name: 'Filename',
          url: 'Link to download the file',
        }],
      },
    },
  },
};

const insertIfMissing = (schedulers, lsp, schedulerData) => schedulers.findOne({
  name: schedulerData.name,
  lspId: lsp._id,
}).then((scheduler) => {
  delete schedulerData._id;
  schedulerData.lspId = lsp._id;
  if (!scheduler) {
    return schedulers.insert(schedulerData);
  }
  return schedulers.updateOne({ _id: scheduler._id }, { $set: schedulerData });
});

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lsp = db.collection('lsp');
    const schedulers = db.collection('schedulers');
    return lsp.find({ $or: [{ name: 'Protranslating' }, { name: 'PTI' }] })
      .toArray()
      .then(lsps => Promise.mapSeries(lsps, l =>
        insertIfMissing(schedulers, l, contactUsNotification)));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
