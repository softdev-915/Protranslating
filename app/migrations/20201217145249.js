const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const template = {
  name: 'Conference Proposal 2_PTI',
  type: 'Quote',
  template: `
<table>
    <tbody>
        <tr>
            <td>{{#if lspLogo}} <img src="{{lspLogo}}"> {{/if}}</td>
            <td>{{ lsp.billingAddress.line1 }} {{ lsp.billingAddress.city }} {{ lsp.billingAddress.state.name }} {{ lsp.billingAddress.zip }} - {{ lsp.billingAddress.country.name }}</td>
            <td>
                <p><span>Simultaneous Interpreting Estimate / Agreement</span></p>
                <p>#{{request.no}}</p>
                <p><span>{{toTimezone request.createdAt 'America/New_York' 'YYYY-MM-DD hh:mm A z'}}</span><br></p>
            </td>
        </tr>
    </tbody>
</table>

<table>
    <tbody>
        <tr>
            <td class="addressheader" colspan="6">
                <span><b>Prepared for</b></span>
            </td>
        </tr>
        <tr>
            <td>{{request.company.name}}</td>
        </tr>
        <tr>
            <td class="address" colspan="6">
                <span>{{ contactBillingAddress.line1 }} {{ contactBillingAddress.city }} {{ contactBillingAddress.state.name }} {{ contactBillingAddress.zip }} - {{ contactBillingAddress.country.name }}</span>
            </td>
        </tr>
    </tbody>
</table>
<p>
    <span>
        <span><br></span>
    </span>
</p>
<p>
    <span><span>Thank you for contacting us and giving us the opportunity to provide you with an estimate for your upcoming event.</span></span>
</p>
<table>
    <tbody>
        <tr>
            <td class="addressheader" colspan="2">
                <span><b>Title</b></span>
            </td>
            <td class="addressheader" colspan="6"><span>{{request.title}}</span></td>
        </tr>
    </tbody>
</table>
<table>
    <tbody>
        <tr>
            <td class="addressheader" colspan="2">
                <span><b>Event Schedule</b></span>
            </td>
            <td class="addressheader" colspan="6">{{{request.comments}}}</td>
        </tr>
    </tbody>
</table>
<table>
    <tbody>
        <tr>
            <td class="addressheader" colspan="2">
                <span><b>Event Location</b></span>
            </td>
            <td class="address" colspan="6"><span>{{request.location.name}}</span></td>
        </tr>
    </tbody>
</table>
<br>
<h6>Your estimate for interpreting services is a follows:</h6>
<div class="divTable auto-width-table">
    <div class="divTableBody">
        <div class="divTableHeader divTableRow">
            <div class="divTableCell">
                Item
            </div>
            <div class="divTableCell"></div>
            <div class="divTableCell text-right">
                Amount
            </div>
        </div>
        {{#each invoices as |invoice|}}
        <div class="divTableRow">
            <div class="divTableCell">
                <b>{{invoice.task.ability}}</b>
            </div>
            <div class="divTableCell"></div>
            <div class="divTableCell text-right">{{requestCurrency}} {{toFixed invoice.foreignTotal 2 }}<br></div>
        </div>
        <div class="divTableRow">
            <div class="divTableCell">
                <b>{{invoice.task.description}}</b>
            </div>
            <div class="divTableCell"></div>
            <div class="divTableCell"></div>
        </div>
        {{#if invoice.task.printSubtotal}} {{#if invoice.workflow.last}}
        <div class="divTableRow"></div>
        {{/if}}
        <div class="divTableRow">
            {{#if invoice.workflow.last}}
            <div class="divTableCell"></div>
            {{else}}
            <div class="divTableCell">
                Subtotal
            </div>
            {{/if}}
            <div class="divTableCell"></div>
            {{#if invoice.workflow.last}}
            <div class="divTableCell text-right"><b>Subtotal</b> {{requestCurrency}} {{ toFixed invoice.workflow.foreignSubtotal 2 }}</div>
            {{ else }}
            <div class="divTableCell text-right">
                {{requestCurrency}} {{ toFixed invoice.workflow.foreignSubtotal 2 }}
            </div>
            {{/if}}
        </div>
        {{/if}} {{/each}}
    </div>
</div>
<div class="total text-right float-right">
    <div class="blue-background font-weight-bold">
        Total {{requestCurrency}} {{ toFixed request.foreignGrandTotal 2 }}
    </div>
</div>
<h6><br></h6>
<p><br></p>
<p>
    <strong>
        General Terms and Conditions<br>
        <br>
        This agreement is entered between ProTranslating, Inc. herein referred to as "ProTranslating", and {{request.company.name}}, herein referred to as "the Customer".
    </strong>
    <br>
    <br>
    <strong>1. Payment Terms: </strong>{{custom.paymentTerms}}<br>
    <br>
    <strong>2. Audio Feed: </strong>{{custom.audioFeed}}<br>
    <br>
    <strong>3. Receiver Distribution &amp; Collection: </strong> {{custom.receiverDistribution}}<br>
    <br>
    <strong>4. Set-Up: </strong>{{custom.setup}}<br>
    <br>
    <strong>5. Equipment: </strong>{{custom.equipment}}<br>
    <br>
    <strong>6. Materials: </strong>{{custom.materialTerms}}<br>
    <br>
    <strong>7. Overtime: </strong><br>
    <br>
    <span>
        <strong>8. Audio Recording: </strong>The Customer and ProTranslating agree not to record the interpreters without the expressed permission of the Customer ProTranslating and that of the interpreters. Should permission be granted,
        recording fees per day per language combination will apply.<br>
        <br>
        <strong>9. Confidentiality:&nbsp;</strong>ProTranslating and any consultant working on its behalf in carrying out this activity expressly undertake to retain in confidence all information transmitted by the other related to this
        activity. ProTranslating and any consultant working on its behalf agree not to divulge the identity of nor any information provided by the Customer or its partners to anyone outside of the direct participants of this activity.
        ProTranslating and any consultant working on its behalf further agree not to discuss the content of any Customer activities, participants in these activities, contacts, meetings, or operations without the expressed written
        permission of the Customer, or designee.<br>
        <br>
        <strong>10. Terms and Conditions:</strong><br>
        <br>
        <span>
            <strong>11. Cancellation:&nbsp;</strong>In the event that the Customer cancels the event or any part thereof, cancellation fees will be assessed as follows: 60-31 days prior to the event 25% cancellation fee 30-15 days prior to the
            event 50% cancellation fee Less than 14 days prior to the event 100% cancellation fee. *If the event requires travel and/or equipment transportation, the client is responsible for any travel costs incurred prior to cancellation.
            <br>
            <br>
            <strong>12. Force Majeure:&nbsp;</strong>The performance of this Agreement is subject to termination without liability for either party upon the occurrence of any circumstance beyond the control of either party such as acts of
            God, war, terrorism, government regulations, disaster, epidemic, pandemic or the issuance of a restriction order by any authority that impedes to celebrate the convention due to health concerns, strikes (except those involving
            the employees or agents of the party seeking the protection of this clause), civil disorder, or curtailment of transportation facilities to the extent that such circumstance makes it illegal or impossible to provide or use the
            venue’s facilities. The ability to terminate this agreement without liability pursuant to this paragraph is conditioned upon delivery of written notice to the other party setting forth the basis for such termination as soon as
            reasonably practical but in no event longer than (10) days after learning of such basis.<br>
            <br>
            <strong>13. The Customer</strong> agrees to pay the charges herein set forth in the manner stipulated.
        </span>
    </span>
</p>
<p>
    <span>
        <span>
            Please sign in the space provided indicating your acceptance of this proposal and the Terms and Conditions.<br>
            <br>
            On behalf of the <strong>Customer</strong>:
        </span>
    </span>
</p>
<table>
    <tbody>
        <tr>
            <td class="addressheader" colspan="2">
                <span><b>Signature</b></span>
            </td>
            <td class="addressheader" colspan="6">
                <br>
                _______________________________________
            </td>
            <td class="addressheader" colspan="2">
                <span><b>Date</b></span>
            </td>
            <td class="addressheader" colspan="6">
                <br>
                ______________________________________
            </td>
        </tr>
        <tr>
            <td class="addressheader" colspan="2">
                <span><b>Print Name</b></span>
            </td>
            <td class="address" colspan="6">
                <br>
                <span>____________________________________</span>
            </td>
            <td class="addressheader" colspan="2">
                <span><b>Title</b></span>
            </td>
            <td class="address" colspan="6">
                <br>
                ___________________________________
            </td>
        </tr>
    </tbody>
</table>
<br>
<p>
    <span>
        <span>On behalf of <strong>ProTranslating</strong>:</span>
    </span>
</p>
<table>
    <tbody>
        <tr>
            <td class="addressheader" colspan="2">
                <span><b>Signature</b></span>
            </td>
            <td class="addressheader" colspan="6">
                <br>
                _______________________________________
            </td>
            <td class="addressheader" colspan="2">
                <span><b>Date</b></span>
            </td>
            <td class="addressheader" colspan="6">
                <br>
                ______________________________________
            </td>
        </tr>
        <tr>
            <td class="addressheader" colspan="2">
                <span><b>Print Name</b></span>
            </td>
            <td class="address" colspan="6">
                <br>
                <span>_______________________________________</span>
            </td>
            <td class="addressheader" colspan="2">
                <span><b>Title</b></span>
            </td>
            <td class="address" colspan="6">
                <br>
                <span>______________________________________</span>
            </td>
        </tr>
    </tbody>
</table>
`,
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const templatesCol = db.collection('templates');
    const lspCol = db.collection('lsp');
    return lspCol.findOne({ name: 'PTI' })
      .then(lsp =>
        templatesCol.findOne({ name: template.name, lspId: lsp._id })
          .then((dbTemplate) => {
            if (_.isNil(dbTemplate)) {
              delete template._id;
              template.lspId = lsp._id;
              return templatesCol.insertOne(template);
            }
            return templatesCol.updateOne({
              _id: dbTemplate._id,
            }, {
              $set: {
                template: template.template,
              },
            });
          }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
