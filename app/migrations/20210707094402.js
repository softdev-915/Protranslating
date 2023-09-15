const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const TRANSLATION_ONLY_TEMPLATE = {
  name: 'DirectFilingParisConvention_TranslationOnly-LMS96',
  type: 'Quote',
  template: `
<div class="nodb-pdf" id="nodb-pdf">
  <div class="nodb-pdf-content" id="nodb-pdf-content">
    <div class="header d-flex flex-column">
        {{#if lsp.logoImage}} <img src="{{lsp.logoImage.base64Image}}" /> {{/if}}
        <p><b>  Translation Estimate for&nbsp;{{request.no}} </b></p>
    </div>
    <div class="main-info d-flex flex-column">
      <span><b>Request No.:</b> {{request.no}} </span> 
      <span><b>Reference No.:</b> {{request.referenceNumber}} </span> 
      <span><b>Project Type:</b> Direct Filing / Paris Convention Translation</span> 
      <span><b>Applicant:</b> {{ipPatent.applicantName}} </span> 
      <span class="validation-deadline-header"><b>Filing Deadline:</b> {{#formatDate ipPatent.fililngDeadline 'DD/MM/YY'}} {{/formatDate}} </span> 
    </div>
    <div class="d-flex flex-column country-table-container only-quote">         
    <table class="instant-quote-table">
        <thead>
          <tr>
            <th class="country-header"><b>COUNTRY</b></th>
            <th><b>TRANSLATION FEE</b></th>
          </tr>
        </thead>
        
         <tbody>
{{#each ipPatent.countries}}

<tr> {{#if instantQuote}}<td>{{name}}</td>
              <td>{{#formatCurrency ../requestCurrency}} {{/formatCurrency}} {{#toFixed translationFee 2}} {{/toFixed}}</td>
              {{/if}}
{{#unless instantQuote}} <td>{{name}}</td>
              <td><span class="custom d-inline-block">Our team is preparing your customized quote</span></td>{{/unless}}</tr>{{/each}}
</tbody></table>
      <div class="total font-weight-bold">
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
      {{/each}}</div>
  </div>
  <div id="nodb-pdf-footer" class="footer">
    <span>{{lsp.phoneNumber}}</span>
    <span>{{lsp.addressInformation.line1}}, {{lsp.addressInformation.line2}}, {{lsp.addressInformation.city}}, {{lsp.addressInformation.state.name}}&nbsp;{{lsp.addressInformation.zip}}</span>
    <span>www.BIG-IP.com</span>
  </div>
</div>`,
};

const FILLING_TEMPLATE = {
  name: 'DirectFilingParisConvention_TranslationAndFiling-LMS96',
  type: 'Quote',
  template: `
<div class="nodb-pdf" id="nodb-pdf">
  <div class="nodb-pdf-content" id="nodb-pdf-content">
    <div class="header d-flex flex-column">
        {{#if lsp.logoImage}} <img src="{{lsp.logoImage.base64Image}}" /> {{/if}}
        <p><b>  Translation Estimate for&nbsp;{{request.no}} </b></p>
    </div>
    <div class="main-info d-flex flex-column">
      <span><b>Request No.:</b> {{request.no}} </span> 
      <span><b>Reference No.:</b> {{request.referenceNumber}} </span> 
      <span><b>Project Type:</b> Direct Filing / Paris Convention Translation</span> 
      <span><b>Applicant:</b> {{ipPatent.applicantName}} </span> 
      <span class="validation-deadline-header"><b>Filing Deadline:</b> {{#formatDate ipPatent.fililngDeadline 'DD/MM/YY'}} {{/formatDate}} </span> 
    </div>
    <div class="d-flex flex-column country-table-container">        
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

<tr> {{#if instantQuote}}<td>{{name}}</td>
              <td>{{#formatCurrency ../requestCurrency}} {{/formatCurrency}} {{#toFixed agencyFee 2}} {{/toFixed}} </td>
              <td>{{#formatCurrency ../requestCurrency}} {{/formatCurrency}} {{#toFixed officialFee 2}} {{/toFixed}} </td>
              <td>{{#formatCurrency ../requestCurrency}} {{/formatCurrency}} {{#toFixed translationFee 2}} {{/toFixed}} </td>
              <td>{{#formatCurrency ../requestCurrency}} {{/formatCurrency}} {{#toFixed total 2}} {{/toFixed}} </td>
              {{/if}}
{{#unless instantQuote}} <td>{{name}}</td>
              <td></td>
              <td class="custom-sell" colspan="3">Our team is preparing your customized quote</td>{{/unless}}</tr>{{/each}}
</tbody></table>
      <div class="total font-weight-bold">
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
      {{/each}}</div>
  </div>
  <div id="nodb-pdf-footer" class="footer">
    <span>{{lsp.phoneNumber}}</span>
    <span>{{lsp.addressInformation.line1}}, {{lsp.addressInformation.line2}}, {{lsp.addressInformation.city}}, {{lsp.addressInformation.state.name}} {{lsp.addressInformation.zip}}</span>
    <span>www.BIG-IP.com</span>
  </div>
</div>`,
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
