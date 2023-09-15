const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const template = {
  name: 'Quote Template PTS_LMS-95_01',
  type: 'Quote',
  template: `
<table>
    <tbody>
        <tr>
            <td>
                {{#if lspLogo}}
                <img src="{{lspLogo}}" />
                {{/if}}
            </td>
            <td style="text-align: right;">
                <h4>
                    <span><span>Quote</span></span>
                </h4>
            </td>
        </tr>
        <tr>
            <td style="text-align: right;"><br /></td>
            <td style="text-align: right;"><h4>#{{request.no}}</h4></td>
        </tr>
        <tr>
            <td><br /></td>
            <td style="text-align: right;">{{ formatDate request.createdAt 'DD/MM/YY' }}<br /></td>
        </tr>

        <tr>
            <td><br /></td>
        </tr>
    </tbody>
</table>

<table>
    <tbody>
        <tr>
            <td class="addressheader">
                <span><b>Prepared by</b></span>
            </td>
        </tr>
        <tr>
            <td class="address">
                <span>{{ username request.salesRep }}<br /></span>
            </td>
        </tr>
    </tbody>
</table>
<table>
    <tbody>
        <tr>
            <td class="addressheader">
                <span> <b>Prepared for</b></span>
            </td>
        </tr>
        <tr>
            <td class="address">
                <p>
                    <span>{{request.company.name}}</span>
                </p>
                <p>
                    <span>
                        {{ request.company.billingAddress.line1 }} {{ request.company.billingAddress.city }} {{ request.company.billingAddress.state.name }} {{ request.company.billingAddress.zip }} - {{
                        request.company.billingAddress.country.name }}
                    </span>
                    <span><br /></span>
                </p>
            </td>
        </tr>
    </tbody>
</table>
<table>
    <tbody>
        <tr>
            <td><b>Software Requirements</b></td>
            <td><b>Delivery Method</b></td>
        </tr>
        <tr>
            <td>{{softwareRequirements}}</td>
            <td>{{request.deliveryMethod.name}}</td>
        </tr>
    </tbody>
</table>

<table>
    <tbody>
        <tr>
            <th>Reference #</th>
            <th>Title</th>
            <th>Turnaround Time</th>
            <th>Terms</th>
        </tr>
        <tr>
            <td>{{ request.referenceNumber }}</td>
            <td>{{request.title}}</td>
            <td>{{request.turnaroundTime}}</td>
            <td>{{request.company.billingInformation.billingTerm.name}}</td>
        </tr>
    </tbody>
</table>

<div class="divTable auto-width-table">
    <div class="divTableBody">
        <div class="divTableHeader divTableRow">
            <div class="divTableCell">Task</div>
            <div class="divTableCell">Description</div>
            <div class="divTableCell">Quantity</div>
            <div class="divTableCell">Breakdown</div>
            <div class="divTableCell">Rates</div>
            <div class="divTableCell text-right">Amount</div>
        </div>
        {{#each invoices as |invoice|}}
        <div class="divTableRow">
            <div class="divTableCell"><b>{{invoice.task.ability}}</b></div>
            <div class="divTableCell">{{invoice.task.description}}</div>
            <div class="divTableCell">{{invoice.quantity}}</div>
            <div class="divTableCell">{{invoice.breakdown.name}}</div>
            <div class="divTableCell">{{invoice.foreignUnitPrice }}</div>
            <div class="divTableCell text-right">{{requestCurrency}} {{toFixed invoice.foreignTotal 2}}<br /></div>
        </div>
        {{#if invoice.task.printSubtotal}} {{#if invoice.workflow.last}}
        <div class="divTableRow"></div>
        {{/if}}
        <div class="divTableRow">
            {{#if invoice.workflow.last}}
            <div class="divTableCell"></div>
            {{else}}
            <div class="divTableCell">Subtotal</div>
            {{/if}}
            <div class="divTableCell"></div>
            <div class="divTableCell"></div>
            <div class="divTableCell"></div>
            <div class="divTableCell"></div>
            {{#if invoice.workflow.last}}
            <div class="divTableCell text-right"><b>Subtotal</b> {{requestCurrency}} {{ toFixed invoice.workflow.foreignSubtotal 2 }}<br /></div>
            {{ else }}
            <div class="divTableCell text-right">{{requestCurrency}} {{ toFixed workflow.foreignSubtotal 2 }}<br /></div>
            {{/if}}
        </div>
        {{/if}} {{/each}}
    </div>
</div>
<div class="total text-right float-right">
    <div class="blue-background font-weight-bold">Total {{requestCurrency}} {{ toFixed request.foreignInvoiceTotal 2 }}</div>
</div>
<h6><br /></h6>

<p><br /></p>
`,
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const templatesCol = db.collection('templates');
    const lspCol = db.collection('lsp');
    return lspCol.findOne({ name: 'Protranslating' })
      .then(lsp =>
        templatesCol.findOne({ name: 'Quote Template PTS_LMS-95_01', lspId: lsp._id })
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
