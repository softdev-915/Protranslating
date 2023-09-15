const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const TRANSLATION_ONLY_TEMPLATE = {
  name: 'PCTNationalPhase_TranslationOnly-LMS96',
  type: 'Quote',
  template: `
  <style>
    .epo-pdf{
      font-family: "Open Sans","Helvetica Neue",Helvetica,Arial,sans-serif;
      width: 100%;
      color: black;
    }
    .wipo-pdf .footer {
      background-color: #686868;
      font-weight: bold;
      color: white;
      font-size: 12px;
      display: flex;
      justify-content: space-between;
      width: 100%;
      padding: 20px 30px;
      margin-top: 20px;
    }  

    .wipo-pdf-content{
      color: black;
    }
    .wipo-pdf-content .country-table-container {
      justify-content: center;
      align-items: center;
      width: 480px;
      margin-left: auto;
      margin-right: auto;
    }
    .instant-quote-table {
      width: 100%;
    }
    .wipo-pdf-content .instant-quote-table th {
      font-size: 12px;
    }
    .wipo-pdf-content .instant-quote-table td {
      font-size: 12px;
    }
    .validation-deadline-header {
      margin-top: 20px;
    }
    .wipo-pdf-content table {
      margin-top: 20px;
    }
    .wipo-pdf-content tr {
      border-bottom: 1px solid #e4e7eb;
    }
    .wipo-pdf-content th {
      padding-right: 10px;
      font-size: 12px;
      text-align: right;
    }
    .wipo-pdf-content th:first-child {
      text-align: left;
      padding-left: 10px;
    }
    .wipo-pdf-content td{
      padding-right: 10px;
      font-size: 12px;
      text-align: right;
    }
    .wipo-pdf-content td > span {
      display: inline-block;
    }
    .wipo-pdf-content tr{
      padding-left: 10px;
      padding-right: 10px;
    }
    .wipo-pdf-content tr td:first-child{
      text-align: left;
      padding-left: 10px;
    }
    .wipo-pdf-content table {
      border-collapse: collapse;
      font-size: 13px;
      height: auto !important;
    }
    .wipo-pdf-content .main-info{
      display: flex;
      flex-direction: column;
    }
    .wipo-pdf-content .header{
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: 20px;
    }
    .wipo-pdf-content .header > p{
      margin-top: 20px;
    } 
    .wipo-pdf-content .main-info{
      font-size: 13px;
    }
    .wipo-pdf-content th{
      background-color: lightgrey;
      font-weight: 500;
    }
    .wipo-pdf-content .body__bullets{
      font-size: 12px;
      margin-top: 20px;
    }
    .wipo-pdf-content .body__bullets p {
      margin-top: 0;
      margin-bottom: 0;
    }
    .wipo-pdf-content .country-table-container {
      display: flex;
      flex-direction: column;
    }
    .wipo-pdf-content .total {
      width: 100%;
      text-align: right;
      font-weight: bold;  
      font-size: 14px;
    }
  </style>
  <div class="wipo-pdf" id='wipo-pdf'>
    <div class="wipo-pdf-content" id='wipo-pdf-content'>
      <div class="header">
          {{#if lsp.logoImage}} <img src='{{lsp.logoImage.base64Image}}' width="200px"> {{/if}}
          <p><b> <u> Translation Estimate for {{ipPatent.patentApplicationNumber}} </u></b></p>
      </div>
      <div class='main-info'>
        <span><b>Patent Title:</b> {{ipPatent.title}} </span> 
        <span><b>Patent Application No.:</b> {{ipPatent.patentApplicationNumber}} </span> 
        <span><b>Patent Publication No.:</b> {{ipPatent.patentPublicationNumber}} </span> 
        <span><b>Applicant:</b> {{ipPatent.applicantName}} </span> 
        <span class="validation-deadline-header"><b>30 Month Deadline:</b> {{#formatDate ipPatent.thirtyMonthsDeadline 'DD/MM/YY'}} {{/formatDate}} </span> 
      </div>
      <div class="country-table-container">
        <table class="instant-quote-table">
          <thead>
            <tr>
              <th class="country-header">COUNTRY</th>
              <th>TRANSLATION&nbsp;FEE</th>
            </tr>
          </thead>
          <tbody>
            {{#each ipPatent.countries}}
              <tr>
                <td>{{name}}</td>
                {{#if instantQuote}}
                <td>{{#formatCurrency ../requestCurrency}} {{/formatCurrency}} {{#toFixed translationFee 2}} {{/toFixed}} </td>
                {{else}}
                  <td>Our team is preparing your customized quote</td>
                {{/if}}
              </tr>
            {{/each}}
          </tbody>
        </table>
        <div class="total">
          <b>
            <span>TOTAL: </span>
            <span>{{requestCurrency}} {{#numberToCurrency ipPatent.total 2}} {{/numberToCurrency}} </span>
          </b>
        </div>
      </div>
      <div class="body__bullets">
        <p>Please note the following:</p>
        {{#each ipPatent.disclaimers}}
        <p> • {{this}} </p>
        {{/each}}
      </div>
    </div>
    <div id='wipo-pdf-footer' class="footer">
      <span>{{lsp.phoneNumber}}</span>
      <span>{{lsp.addressInformation.line1}}, {{lsp.addressInformation.line2}}, {{lsp.addressInformation.city}}, {{lsp.addressInformation.state.name}} {{lsp.addressInformation.zip}}</span>
      <span>www.BIG-IP.com</span>
    </div>
  </div>
`,
};

const FILING_TEMPLATE = {
  name: 'PCTNationalPhase_TranslationAndFiling-LMS96',
  type: 'Quote',
  template: `
  <style>
    .wipo-pdf{
      font-family: "Open Sans","Helvetica Neue",Helvetica,Arial,sans-serif;
      width: 100%;
      color: black;
    }
    .wipo-pdf .footer {
      background-color: #686868;
      font-weight: bold;
      color: white;
      font-size: 12px;
      display: flex;
      justify-content: space-between;
      width: 100%;
      padding: 20px 25px;
      margin-top: 20px;
    }  

    .wipo-pdf-content{
      color: black;
    }
    .wipo-pdf-content .country-table-container {
      justify-content: center;
      align-items: center;
      margin-left: auto;
      margin-right: auto;
    }
    .wipo-pdf-content .instant-quote-table th {
      font-size: 12px;
    }
    .wipo-pdf-content .instant-quote-table td {
      font-size: 12px;
    }
    .validation-deadline-header {
      margin-top: 20px;
    }
    .wipo-pdf-content table {
      width: 100%;
      margin-top: 20px;
    }
    .wipo-pdf-content tr {
      border-bottom: 1px solid #e4e7eb;
    }
    .wipo-pdf-content th {
      padding-right: 10px;
      font-size: 12px;
      text-align: right;
    }
    .wipo-pdf-content th:first-child {
      text-align: left;
      padding-left: 10px;
    }
    .wipo-pdf-content td {
      padding-right: 10px;
      font-size: 12px;
      text-align: right;
    }
    .wipo-pdf-content td > span {
      display: inline-block;
    }
    .wipo-pdf-content tr{
      padding-left: 10px;
      padding-right: 10px;
    }
    .wipo-pdf-content tr td:first-child{
      text-align: left;
      padding-left: 10px;
    }
    .wipo-pdf-content table {
      border-collapse: collapse;
      font-size: 13px;
      height: auto !important;
    }
    .wipo-pdf-content .align-right {
      text-align: right;
    }
    .wipo-pdf-content .main-info{
      display: flex;
      flex-direction: column;
    }
    .wipo-pdf-content .header{
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: 20px;
    }
    .wipo-pdf-content .header > p{
      margin-top: 20px;
    } 
    .wipo-pdf-content .main-info{
      font-size: 13px;
    }
    .wipo-pdf-content th{
      background-color: lightgrey;
      font-weight: 500;
    }
    .wipo-pdf-content .body__bullets{
      font-size: 12px;
      margin-top: 20px;
    }
    .wipo-pdf-content .body__bullets p {
      margin-top: 0;
      margin-bottom: 0;
    }
    .wipo-pdf-content .country-table-container {
      display: flex;
      flex-direction: column;
    }
    .wipo-pdf-content .total {
      width: 100%;
      text-align: right;
      font-weight: bold;  
      font-size: 14px;
    }
  </style>
  <div class="wipo-pdf" id='wipo-pdf'>
    <div class="wipo-pdf-content" id='wipo-pdf-content'>
      <div class="header">
          {{#if lsp.logoImage}} <img src='{{lsp.logoImage.base64Image}}' width="200px"> {{/if}}
          <p><b> <u> Translation Estimate for {{ipPatent.patentApplicationNumber}} </u></b></p>
      </div>
      <div class='main-info'>
        <span><b>Patent Title:</b> {{ipPatent.title}} </span> 
        <span><b>Patent Application No.:</b> {{ipPatent.patentApplicationNumber}} </span> 
        <span><b>Patent Publication No.:</b> {{ipPatent.patentPublicationNumber}} </span> 
        <span><b>Applicant:</b> {{ipPatent.applicantName}} </span> 
        <span class="validation-deadline-header"><b>30 Month Deadline:</b> {{#formatDate ipPatent.thirtyMonthsDeadline 'DD/MM/YY'}} {{/formatDate}} </span> 
      </div>
      <div class="country-table-container">
        <table class="instant-quote-table">
          <thead>
            <tr>
              <th class="country-header">COUNTRY</th>
              <th class="country-header">AGENCY FEE</th>
              <th class="country-header">OFFICIAL FEE</th>
              <th>TRANSLATION&nbsp;FEE</th>
              <th class="country-header">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {{#each ipPatent.countries}}
              <tr>
                <td>{{name}}</td>
                {{#if instantQuote}}
                <td>{{#formatCurrency ../requestCurrency}} {{/formatCurrency}} {{#toFixed agencyFee 2}} {{/toFixed}} </td>
                  <td>{{#formatCurrency ../requestCurrency}} {{/formatCurrency}} {{#toFixed officialFee 2}} {{/toFixed}} </td>
                  <td>{{#formatCurrency ../requestCurrency}} {{/formatCurrency}} {{#toFixed translationFee 2}} {{/toFixed}} </td>
                  <td>{{#formatCurrency ../requestCurrency}} {{/formatCurrency}} {{#toFixed total 2}} {{/toFixed}} </td>
                {{else}}
                  <td colspan="4" class="align-right">
                    Our team is preparing your customized quote
                  </td>
                {{/if}}
              </tr>
            {{/each}}
          </tbody>
        </table>
        <div class="total">
          <b>
            <span>TOTAL: </span>
            <span>{{requestCurrency}} {{#numberToCurrency ipPatent.total 2}} {{/numberToCurrency}}</span>
          </b>
        </div>
      </div>
      <div class="body__bullets">
        <p>Please note the following:</p>
        {{#each ipPatent.disclaimers}}
        <p> • {{this}} </p>
        {{/each}}
        {{#compare ipPatent.kind '===' 'B1'}}
        <p>
          •  As B1 is not available these values are being calculated from {{wipo.kind}}
        </p>
        {{/compare}}
      </div>
    </div>
    <div id='wipo-pdf-footer' class="footer">
      <span>{{lsp.phoneNumber}}</span>
      <span>{{lsp.addressInformation.line1}}, {{lsp.addressInformation.line2}}, {{lsp.addressInformation.city}}, {{lsp.addressInformation.state.name}} {{lsp.addressInformation.zip}}</span>
      <span>www.BIG-IP.com</span>
    </div>
  </div>
`,
};
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const templatesCol = db.collection('templates');
    const lspCol = db.collection('lsp');
    return Promise.each([TRANSLATION_ONLY_TEMPLATE, FILING_TEMPLATE], template => lspCol.findOne({ name: 'BIG IP' })
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
          }),

      ));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
