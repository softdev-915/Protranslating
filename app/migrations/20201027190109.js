const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const template = {
  name: 'Email Template PTI 1',
  type: 'Quote Email',
  template: `
  <p>
    As previously communicated this email serves as reconfirmation for the interpreting services you requested. An email response to this communication would be appreciated however, if we do not hear from you we will consider this
    assignment confirmed.&nbsp;<br />
    Please see cancellation policy below.&nbsp;<br />
    ProTranslating&nbsp;<br />
    2850 Douglas Rd., Coral Gables, Fl 33134&nbsp;<br />
    Ph: 305-371-7887/ Fax: 305-371-8366/ After Hours: 305-479-0442&nbsp;<br />
    SHOULD THERE BE ANY CHANGES, PLEASE REPLY TO THIS EMAIL.&nbsp;<br />
    CANCELLATIONS NEED TO BE EMAILED SO AS TO HAVE PROOF OF SAME.&nbsp;<br />
    SCHEDULE CONFIRMATION {{request.languages}} INTERPRETER&nbsp;<br />
    Assignment # {{request.no}}&nbsp;<br />
    Confirmation For:&nbsp;<br />
    Firm: {{request.companyMame}}&nbsp;<br />
    Attorney: {{request.contactName}}&nbsp;<br />
    Scheduled On: {{request.}}&nbsp;<br />
    Contact: {{request.requestContact}}&nbsp;<br />
    Assignment Details:&nbsp;<br />
    Date and Time: {{request.Request expected start date time}}&nbsp;<br />
    Estimated Length: {{request.Expected duration time (Hours)}}&nbsp;<br />
    Location: {{request.location}}&nbsp;<br />
    Deponent: {{request.recipient}}&nbsp;<br />
    Case: {{request.title}}&nbsp;<br />
    Case/Claim No.: {{request.referenceNumber}}&nbsp;<br />
    Case Type: {{request.type (Conference/Meeting/Deposition)}}&nbsp;<br />
    Language: {{request.languages }}&nbsp;<br />
    Special Instructions: {{request.comments}}
</p>
<p><br /></p>
<p><span>{{custom.memo}}</span></p>
  `,
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const templatesCol = db.collection('templates');
    const lspCol = db.collection('lsp');
    return lspCol.findOne({ name: 'PTI' })
      .then(lsp =>
        templatesCol.findOne({ name: 'Email Template PTI 1', lspId: lsp._id })
          .then((dbTemplate) => {
            if (_.isNil(dbTemplate)) {
              template.lspId = lsp._id;
              return templatesCol.insertOne(template);
            }
            return Promise.resolve();
          }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
