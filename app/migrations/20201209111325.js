const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const Promise = require('bluebird');

const template = {
  name: 'Master template',
  type: 'Quote',
  template: `
<table>
    <tbody>
        <tr>
            <td>{{#if lspLogo}} <img src="{{lspLogo}}"> {{/if}}</td>
            <td style="text-align:right;">
                <h4>
                    <span><span>Quote</span></span>
                </h4>
            </td>
        </tr>
        <tr>
            <td style="text-align:right;"><br></td>
            <td style="text-align:right;">
                <h4>#{{request.no}}</h4>
            </td>
        </tr>
        <tr>
            <td><br></td>
            <td style="text-align:right;">{{ formatDate request.createdAt 'DD/MM/YY' }}<br></td>
        </tr>
        <tr>
            <td><br></td>
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
                <span>{{ username request.salesRep }}<br></span>
            </td>
        </tr>
    </tbody>
</table>
<table>
    <tbody>
        <tr>
            <td class="addressheader">
                <span><b>Prepared for</b></span>
            </td>
        </tr>
        <tr>
            <td class="address">
                <p><span>{{request.company.name}}</span></p>
                <p>
                    <span>
                        {{ request.company.billingAddress.line1 }} {{ request.company.billingAddress.city }} {{ request.company.billingAddress.state.name }} {{ request.company.billingAddress.zip }} - {{
                        request.company.billingAddress.country.name }}
                    </span>
                    <span><br></span>
                </p>
            </td>
        </tr>
    </tbody>
</table>
<table style="width:500px;">
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
            <div class="divTableCell">
                Item
            </div>
            <div class="divTableCell">
                Language combination
           </div>
           <div class="divTableCell">Breakdown</div>
            <div class="divTableCell">
                Quantity
            </div>
            <div class="divTableCell">
                Rate
            </div>
            <div class="divTableCell text-right">
                Amount
            </div>
        </div>
        {{#each invoices as |invoice|}}
    </div>
    <div class="divTableBody">
        <div class="divTableRow">
            <div class="divTableCell">
                <b>{{invoice.task.description}}</b>
            </div>
            <div class="divTableCell"><span>{{invoice.workflow.srcLang.name}} -&nbsp;</span><span>{{invoice.workflow.tgtLang.name}} </span></div><div class="divTableCell"><span>{{invoice.breakdown.name}}</span></div>
            {{#if invoice.shouldPrintMinCharge}}
            <div class="divTableCell">
                1
            </div>
            {{ else }}
            <div class="divTableCell">{{invoice.quantity}}<br></div>
            {{/if}} {{#if invoice.shouldPrintMinCharge}}
            <div class="divTableCell">
                {{toFixed invoice.task.foreignMinCharge 2 }}
            </div>
            {{ else }}
               {{#eq invoice.task.ability 'Discount' }}
                  <div class="divTableCell">({{toFixed invoice.unitPrice 2 true }})<br></div>
               {{/eq}}
               {{#isnt invoice.task.ability 'Discount' }}
                  <div class="divTableCell">{{toFixed invoice.unitPrice 2}}<br></div>
               {{/isnt}}
            {{/if}}
            {{#if invoice.shouldPrintMinCharge}}
               <div class="divTableCell text-right">{{requestCurrency}} {{toFixed invoice.task.foreignTotal 2}}<br></div>
            {{ else }}
               {{#eq invoice.task.ability 'Discount' }}
                  <div class="divTableCell text-right">{{requestCurrency}} ({{toFixed invoice.foreignTotal 2 true}})<br></div>
               {{/eq}}
               {{#isnt invoice.task.ability 'Discount' }}
                  <div class="divTableCell text-right">{{requestCurrency}} {{toFixed invoice.foreignTotal 2}}<br></div>
               {{/isnt}}
            {{/if}}
        </div>
      {{#if invoice.task.printSubtotal}}
        <div class="divTableRow">
          <div class="divTableCell"></div>
          <div class="divTableCell"></div>
          <div class="divTableCell"></div>
          <div class="divTableCell"></div>
          <div class="divTableCell"><b>Subtotal</b></div>
          <div class="divTableCell text-right">{{requestCurrency}} {{ toFixed invoice.workflow.foreignSubtotal&nbsp;2 }}<br></div>
        </div>
        {{/if}} {{/each}}
    </div>
</div>
<div class="total text-right float-right">
    <div class="blue-background font-weight-bold">
        Total {{requestCurrency}} {{ toFixed request.foreignInvoiceTotal 2 }}
    </div>
</div>
<h6><br></h6>
<p><br></p>
`,
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const templatesCol = db.collection('templates');
    const lspCol = db.collection('lsp');
    return lspCol.find({})
      .toArray()
      .then(lsps =>
        Promise.map(lsps, lsp =>
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
            }),
        ));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
