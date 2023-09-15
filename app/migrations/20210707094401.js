const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const TRANSLATION_ONLY_TEMPLATE = {
  name: 'EPValidation_TranslationOnly-LMS96',
  type: 'Quote',
  template: `
  <style>
    .epo-pdf{
      font-family: "Open Sans","Helvetica Neue",Helvetica,Arial,sans-serif;
      width: 100%;
      color: black;
    }
    .epo-pdf .footer {
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

    .epo-pdf-content{
      color: black;
    }
    .epo-pdf-content .country-table-container {
      justify-content: center;
      align-items: center;
      width: 480px;
      margin-left: auto;
      margin-right: auto;
    }
    .epo-pdf-content .instant-quote-table{
      th{
        font-size: 12px;
      }
      td{
        font-size: 12px;
      }
    }
    .validation-deadline-header {
      margin-top: 20px;
    }
    .epo-pdf-content table {
      margin-top: 20px;
    }
    .epo-pdf-content tr {
      border-bottom: 1px solid #e4e7eb;
    }
    .epo-pdf-content th {
      padding-right: 10px;
      font-size: 12px;
      text-align: right;
    }
    .epo-pdf-content th:first-child {
      text-align: left;
      padding-left: 10px;
    }
    .epo-pdf-content td{
      padding-right: 10px;
      width: 70%;
      font-size: 12px;
      text-align: right;
    }
    .epo-pdf-content td > span {
      display: inline-block;
    }
    .epo-pdf-content tr{
      padding-left: 10px;
      padding-right: 10px;
    }
    .epo-pdf-content tr td:first-child{
      text-align: left;
      padding-left: 10px;
    }
    .epo-pdf-content table {
      border-collapse: collapse;
      font-size: 13px;
      height: auto !important;
    }
    .epo-pdf-content .main-info{
      display: flex;
      flex-direction: column;
    }
    .epo-pdf-content .header{
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: 20px;
    }
    .epo-pdf-content .header > p{
      margin-top: 20px;
    } 
    .epo-pdf-content .main-info{
      font-size: 13px;
    }
    .epo-pdf-content th{
      background-color: lightgrey;
      font-weight: 500;
    }
    .epo-pdf-content .body__bullets{
      font-size: 12px;
      margin-top: 20px;
    }
    .epo-pdf-content .body__bullets p {
      margin-top: 0;
      margin-bottom: 0;
    }
    .epo-pdf-content .country-table-container {
      display: flex;
      flex-direction: column;
    }
    .epo-pdf-content .total {
      width: 100%;
      text-align: right;
      font-weight: bold;  
      font-size: 14px;
    }
  </style>
  <div class="epo-pdf" id='epo-pdf'>
    <div class="epo-pdf-content" id='epo-pdf-content'>
      <div class="header">
          {{#if lsp.logoImage}} <img src='{{lsp.logoImage.base64Image}}' width="200px"> {{/if}}
          <p><b> <u> Translation Estimate for {{ipPatent.patentPublicationNumber}} </u></b></p>
      </div>
      <div class='main-info'>
        <span><b>Patent Title:</b> {{ipPatent.title}} </span> 
        <span><b>Patent Application No.:</b> {{ipPatent.patentApplicationNumber}} </span> 
        <span><b>Patent Publication No.:</b> {{ipPatent.patentPublicationNumber}} </span> 
        <span><b>Applicant:</b> {{ipPatent.applicantName}} </span> 
        <span class="validation-deadline-header"><b>Validation Deadline:</b> {{#formatDate ipPatent.validationDeadline 'DD/MM/YY'}} {{/formatDate}} </span> 
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
                <td>{{#formatCurrency ../requestCurrency}} {{/formatCurrency}} {{#toFixed translationFee 2}} {{/toFixed}}</td>
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
        {{#compare ipPatent.kind '!==' 'B1'}}
        <p>
          •  As B1 is not available these values are being calculated from {{epo.kind}}
        </p>
        {{/compare}}
      </div>
    </div>
    <div id='epo-pdf-footer' class="footer">
      <span>{{lsp.phoneNumber}}</span>
      <span>{{lsp.addressInformation.line1}}, {{lsp.addressInformation.line2}}, {{lsp.addressInformation.city}}, {{lsp.addressInformation.state.name}} {{lsp.addressInformation.zip}}</span>
      <span>www.BIG-IP.com</span>
    </div>
  </div>
`,
};

const FILLING_TEMPLATE = {
  name: 'EPValidation_TranslationAndFiling-LMS96',
  type: 'Quote',
  template: `
  <style>
    .epo-pdf{
      font-family: "Open Sans","Helvetica Neue",Helvetica,Arial,sans-serif;
      width: 100%;
      color: black;
    }
    .epo-pdf .footer {
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

    .epo-pdf-content{
      color: black;
    }
    .epo-pdf-content .country-table-container {
      justify-content: center;
      align-items: center;
      margin-left: auto;
      margin-right: auto;
    }
    .epo-pdf-content .instant-quote-table{
      th{
        font-size: 12px;
      }
      td{
        font-size: 12px;
      }
    }
    .validation-deadline-header {
      margin-top: 20px;
    }
    .epo-pdf-content table {
      margin-top: 20px;
    }
    .epo-pdf-content tr {
      border-bottom: 1px solid #e4e7eb;
    }
    .epo-pdf-content th {
      padding-right: 10px;
      font-size: 12px;
      text-align: right;
    }
    .epo-pdf-content th:first-child {
      text-align: left;
      padding-left: 10px;
    }
    .epo-pdf-content td{
      padding-right: 10px;
      width: 70%;
      font-size: 12px;
      text-align: right;
    }
    .epo-pdf-content td > span {
      display: inline-block;
    }
    .epo-pdf-content tr{
      padding-left: 10px;
      padding-right: 10px;
    }
    .epo-pdf-content tr td:first-child{
      text-align: left;
      padding-left: 10px;
    }
    .epo-pdf-content table {
      border-collapse: collapse;
      font-size: 13px;
      height: auto !important;
    }
    .epo-pdf-content .main-info{
      display: flex;
      flex-direction: column;
    }
    .epo-pdf-content .header{
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: 20px;
    }
    .epo-pdf-content .header > p{
      margin-top: 20px;
    } 
    .epo-pdf-content .main-info{
      font-size: 13px;
    }
    .epo-pdf-content th{
      background-color: lightgrey;
      font-weight: 500;
    }
    .epo-pdf-content .body__bullets{
      font-size: 12px;
      margin-top: 20px;
    }
    .epo-pdf-content .body__bullets p {
      margin-top: 0;
      margin-bottom: 0;
    }
    .epo-pdf-content .country-table-container {
      display: flex;
      flex-direction: column;
    }
    .epo-pdf-content .total {
      width: 100%;
      text-align: right;
      font-weight: bold;  
      font-size: 14px;
    }
  </style>
  <div class="epo-pdf" id='epo-pdf'>
    <div class="epo-pdf-content" id='epo-pdf-content'>
      <div class="header">
          {{#if lsp.logoImage}} <img src='{{lsp.logoImage.base64Image}}' width="200px"> {{/if}}
          <p><b> <u> Translation Estimate for {{ipPatent.patentPublicationNumber}} </u></b></p>
      </div>
      <div class='main-info'>
        <span><b>Patent Title:</b> {{ipPatent.title}} </span> 
        <span><b>Patent Application No.:</b> {{ipPatent.patentApplicationNumber}} </span> 
        <span><b>Patent Publication No.:</b> {{ipPatent.patentPublicationNumber}} </span> 
        <span><b>Applicant:</b> {{ipPatent.applicantName}} </span> 
        <span class="validation-deadline-header"><b>Validation Deadline:</b> {{#formatDate ipPatent.validationDeadline 'DD/MM/YY'}} {{/formatDate}} </span> 
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
                <td>{{#formatCurrency ../requestCurrency}} {{/formatCurrency}} {{#toFixed agencyFeeFixed 2}} {{/toFixed}} </td>
                <td>{{#formatCurrency ../requestCurrency}} {{/formatCurrency}} {{#toFixed officialFee 2}} {{/toFixed}} </td>
                <td>{{#formatCurrency ../requestCurrency}} {{/formatCurrency}} {{#toFixed translationFee 2}} {{/toFixed}} </td>
                <td>{{#formatCurrency ../requestCurrency}} {{/formatCurrency}} {{#toFixed total 2}} {{/toFixed}} </td>
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
        {{#compare ipPatent.kind '!==' 'B1'}}
        <p>
          •  As B1 is not available these values are being calculated from {{epo.kind}}
        </p>
        {{/compare}}
      </div>
    </div>
    <div id='epo-pdf-footer' class="footer">
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
    return Promise.each([TRANSLATION_ONLY_TEMPLATE, FILLING_TEMPLATE], template => lspCol.findOne({ name: 'BIG IP' })
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
