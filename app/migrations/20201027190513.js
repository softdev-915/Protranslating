const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const template = {
  name: 'Interpreting Quote_PTI',
  type: 'Quote',
  template: `
As previously communicated this email serves as reconfirmation for the interpreting services you requested. An email response to this communication would be appreciated however, if we do not hear from you we will consider this assignment
confirmed.<br />
<br />
Please see cancellation policy below.&nbsp;<br />
<br />
<b>ProTranslating</b><br />
{{ lsp.billingAddress.line1 }} {{ lsp.billingAddress.city }} {{ lsp.billingAddress.state.name }} {{ lsp.billingAddress.zip }} - {{ lsp.billingAddress.country.name }}<br />
Ph: 305-371-7887/ Fax: 305-371-8366/ After Hours: 305-479-0442<br />
<br />
SHOULD THERE BE ANY CHANGES, PLEASE REPLY TO THIS EMAIL.<br />
CANCELLATIONS NEED TO BE EMAILED SO AS TO HAVE PROOF OF SAME.<br />
<br />
<b>SCHEDULE CONFIRMATION/{{languageCombinationList}} INTERPRETER</b><br />
<b>Assignment #{{request.no}}</b>
<div>
    <br />
    <b>Confirmation For:</b><br />
    <br />
    <b>Firm:</b>&nbsp;&nbsp;{{request.company.name}<br />
    <b>Attorney:</b>&nbsp;&nbsp;{{requestContactName}}<br />
    <b>Scheduled On:&nbsp;</b>{{formatDate request.createdAt 'MM/DD/YYYY'}}<br />
    <b>Contact:</b>&nbsp;<span> {{requestSchedulingContactName}}</span><br />
    <br />
    <br />
    <b>Assignment Details:</b><br />
    <br />
    <b>Date:</b>&nbsp;{{formatDate request.expectedStartDate 'MM/DD/YYYY'}}<br />
    <b>Time:&nbsp;</b>
    <span>
        <span>{{formatDate request.expectedStartDate 'HH:mm'}}</span><br />
        <b>Estimated Length:</b><span><b> </b>{{request.expectedDurationTime}} Hours</span>
    </span>
    <div>&nbsp;</div>

    <div>
        <span><b>Location:</b><span> </span></span><br />
        {{request.location.name}} <br />
        &nbsp;
    </div>
    <span>
        <b>Deponent:</b><span> </span>{{request.recipient}}<br />
        <b>Case:</b><span> </span>
    </span>
    {{request.title}}<br />
    <span><b>Case/Claim No.:</b><span> </span></span>{{request.referenceNumber}}<br />
    <span><b>Case Type: </b>{{request.type}}</span><br />
    <span>L</span><b>anguage:<span>&nbsp;</span></b><span>{{languageCombinationList}}</span>
</div>

<div>&nbsp;</div>

<div><b>Special Instructions</b></div>

<div>{{{request.comments}}}</div>

<div>&nbsp;</div>

<div>
    <div>
        <div>
            <p><span>Cancellation Policies as of February, 2018:</span></p>

            <p>
                <span>·<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><span>Greater Miami &amp; Broward:</span>
            </p>

            <p>
                <span>
                    -Spanish: A fee of 2hrs will be charged for assignments cancelled&nbsp;<span><span>within 3&nbsp;business hours prior to the scheduled start time</span></span><span>.</span>
                </span>
            </p>

            <p><span>-Creole, French, Italian, German &amp; Portuguese: A fee of 2hrs will be charged for assignments cancelled within 1 business day.</span></p>

            <p>
                <span>·<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><span>Outside Greater Miami &amp; Broward area:</span>
            </p>

            <p><span>-All languages: A fee of 2hrs will be charged for assignments cancelled within 1 business day.</span></p>

            <p>
                <span>·<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span>
                <span>
                    Exotic Languages: 5 business day cancellation – a cancellation fee of $205.00 will be charged for assignments cancelled within 5 business day of the scheduled date, 2hrs minimum charge for cancellations within 2 business
                    day.
                </span>
            </p>

            <p><span>Rates:</span></p>

            <p>
                <span>·<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><span>Spanish $115p/hr 2hr min</span>
            </p>

            <p>
                <span>·<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><span>Spanish Federal $130.00 p/hr 2hr min</span>
            </p>

            <p>
                <span>·<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><span>Creole $145.00 p/hr 2hr min</span>
            </p>

            <p>
                <span>·<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><span>Fre-Ita-Ger &amp; Port $150.00 p/hr 2hr min</span>
            </p>

            <p>
                <span>·<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><span>Exotic Languages $160.00 p/hr 2hr min – Travel Fee may apply.</span>
            </p>

            <p>
                <br />
                <span>
                    The established fees apply to services provided during regular business hours, 9:00am - 5:00pm, Monday - Friday. The rates of time and a half are applicable before or after regular working hours, weekends and holidays.
                </span>
            </p>
        </div>
    </div>
</div>
  `,
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const templatesCol = db.collection('templates');
    const lspCol = db.collection('lsp');
    return lspCol.findOne({ name: 'PTI' })
      .then(lsp =>
        templatesCol.findOne({ name: 'Interpreting Quote_PTI', lspId: lsp._id })
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
