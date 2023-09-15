const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const ptsTemplate = {
  name: 'Basic',
  type: 'Invoice',
  template: `
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Template</title>
    <style type="text/css">
        #invoiceTemplate {
            width: 780px;
        }
        .middle-size-header {
            font-size: 16px;
            font-weight: bold;
        }
        .big-size-header {
            font-size: 21px;
        }
        .local-header {
            color: #0c547b;
            font-weight: bold;
        }
        .invoice-total-box {
            width: 100%;
            float: right;
            text-align: right;
            padding: 0 10px;
            display: block;
        }
        .invoice-total-box p {
            margin-bottom: 2px;
            font-weight: bold;
            color: black;
        }
        .horizontal-line {
            border-bottom: medium none;
            border-left: medium none;
            background-color: #cfdde7;
            height: 3px;
            color: #cfdde7;
            border-top: medium none;
            border-right: medium none;
        }
        .blue-light-bg {
            background-color: #cfdde7;
        }
    </style>
</head>
<body>
<div id="invoiceTemplate" class="container-fluid p-2">

    <!-- header -->
    <div class="row align-items-center">
        <div class="col-6">
            <span class="middle-size-header">{{ invoice.lsp.name }}</span>
            <br/>
            {{ invoice.lsp.addressInformation.line1 }}
            <br/>
            {{ invoice.lsp.addressInformation.address }}
            <br/>
            Phone: {{ invoice.lsp.phoneNumber }}
            <br/>
            <a href="{{ invoice.lsp.url }}">{{ invoice.lsp.url }}</a>
            <br/>
            Tax ID: {{ invoice.lsp.taxId }}</span>
        </div>
        <div class="col-6 text-right">
            <img src="{{ invoice.lsp.logoImage}}" alt="{{ invoice.lsp.name }}"/>
        </div>
    </div>

    <!-- invoice info -->
    <div class="row">
        <div class="col-12 text-right">
                    <span class="big-size-header">
                      Invoice
                      <br/>
                      #{{invoice.no}}
                      <br/>
                    </span>
            {{invoice.date}}
        </div>
    </div>

    <div class="row">
        <div class="col-8">
            <span class="local-header">Bill To</span><br/>
            {{ invoice.contact.firstName }} {{ invoice.contact.lastName }}<br/>
            {{ invoice.contact.billingAddress.billingAddressText }}
        </div>
        <div class="col-4 invoice-total-box blue-light-bg">
            <p class="local-header middle-size-header">TOTAL</p>
            <p class="big-size-header">
                {{ invoice.accounting.currency.isoCode }}
                {{ invoice.accounting.amount }}
            </p>
            <p>
                <span class="local-header">Due Date:</span>
                {{invoice.dueDate}}
            </p>
        </div>
    </div>
    <!-- invoice info ends-->
    <hr class="horizontal-line"/>
    <!-- detail info -->
    <div class="row">
        <div class="col-12">
            <table class="table">
                <thead class="blue-light-bg local-header">
                <tr>
                    <th>PO #</th>
                    <th>Account Executive</th>
                    <th>Terms</th>
                    <th>Due Date</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td>{{invoice.purchaseOrder}}</td>
                    <td>{{invoice.salesRep.firstName}} {{invoice.salesRep.lastName}}</td>
                    <td>{{invoice.billingTerm.name}}</td>
                    <td>{{invoice.dueDate}}</td>
                </tr>
                </tbody>
            </table>
        </div>
    </div>
    <div class="row">
        <div class="col-12">
            <table class="table">
                <thead class="blue-light-bg local-header">
                <tr>
                    <th>Description</th>
                </tr>
                </thead>
                <tbody>
                {{#each invoice.entries}}
                <tr>
                    <td>
                        {{this.numberTitleLangCombDescription}}
                        <br/>
                        <b>{{ this.taskName }}</b>
                    </td>
                </tr>
                {{/each}}
                </tbody>
            </table>
        </div>
    </div>
    <!-- detail info ends -->
    <hr class="horizontal-line"/>
    <!-- total -->
    <div class="row">
        <div class="col-6"></div>
        <div class="col-6 text-right">
            <div class="row">
                <div class="col-6 local-header">
                    TOTAL
                </div>
                <div class="col-6 local-header">
                    {{ invoice.accounting.currency.isoCode }}
                    {{ invoice.accounting.amount }}
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-6">
            Please reference invoice number with payment. Thank you for your business!
        </div>
        <div class="col-6 text-right">
            <div class="row">
                <div class="col-6">
                    Amount Paid
                </div>
                <div class="col-6">
                    {{ invoice.accounting.currency.isoCode }}
                    {{ invoice.accounting.paid }}
                </div>
            </div>
        </div>
    </div>

    <div class="row blue-light-bg">
        <div class="col-6"></div>
        <div class="col-6 text-right">
            <div class="row middle-size-header">
                <div class="col-6 local-header">
                    Amount Remaining
                </div>
                <div class="col-6">
                    {{ invoice.accounting.currency.isoCode }}
                    {{ invoice.accounting.balance }}
                </div>
            </div>
        </div>
    </div>
    <!-- total ends -->
</div>
</body>
</html>
  `,

};
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const lsp = db.collection('lsp');
    const templates = db.collection('templates');
    return lsp.findOne({ name: 'Protranslating' })
      .then((ptsLsp) => {
        if (_.isEmpty(ptsLsp)) {
          return;
        }
        ptsTemplate.lspId = ptsLsp._id;
        return templates.update({
          name: ptsTemplate.name,
          type: ptsTemplate.type,
          lspId: ptsTemplate.lspId,
        }, ptsTemplate, { upsert: true });
      });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => {
    throw err;
  });
} else {
  module.exports = migration;
}
