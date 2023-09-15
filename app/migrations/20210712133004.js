const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const TRANSLATION_ONLY_TEMPLATE = {
  name: 'DirectFilingParisConvention_TranslationOnly-LMS96',
  type: 'Quote',
  template: `
  <div class="bigip-pdf" id="nodb-pdf">
    <div class="bigip-pdf-content" id="nodb-pdf-content">
      <div class="bigip-pdf-header">
        {{#if lsp.logoImage}} <img src="{{lsp.logoImage.base64Image}}" /> {{/if}}
        <p><b>  Translation Estimate for&nbsp;{{request.no}} </b></p>
      </div>
      <div class="bigip-pdf-main-info">
        <span><b>Request No.:</b> {{request.no}} </span> 
        <span><b>Reference No.:</b> {{request.referenceNumber}} </span> 
        <span><b>Project Type:</b> Direct Filing / Paris Convention Translation</span> 
        <span><b>Applicant:</b> {{ipPatent.applicantName}} </span> 
        <span class="bigip-pdf-validation-deadline-header"><b>Filing Deadline:</b> {{#formatDate ipPatent.fililngDeadline 'DD/MM/YY'}} {{/formatDate}} </span> 
      </div>
      <div class="bigip-pdf-country-table-container no-filing">         
        <table class="bigip-pdf-instant-quote-table">
          <thead>
            <tr>
              <th class="bigip-pdf-country-header"><b>COUNTRY</b></th>
              <th><b>TRANSLATION FEE</b></th>
            </tr>
          </thead>
          <tbody>
            {{#each ipPatent.countries}}
            <tr>
              <td>{{name}}</td>
              {{#if instantQuote}}
                <td>{{#formatCurrency ../requestCurrency}} {{/formatCurrency}} {{#toFixed translationFee 2}} {{/toFixed}}</td>
              {{else}}
                <td>Our team is preparing your customized quote</td>
              {{/if}}
            </tr>
            {{/each}}
          </tbody>
        </table>
        <div class="bigip-pdf-total">
          <b>
            <span>TOTAL: </span>
            <span>{{requestCurrency}} {{#numberToCurrency ipPatent.total 2}} {{/numberToCurrency}}</span>
          </b>
        </div>
      </div>
      <div class="bigip-pdf-body__bullets">
        <p>Please note the following:</p>
        {{#each ipPatent.disclaimers}}
          <p> • {{this}} </p>
        {{/each}}
      </div>
    </div>
    <div id="nodb-pdf-footer" class="bigip-pdf-footer">
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
  <div class="bigip-pdf" id="nodb-pdf">
    <div class="bigip-pdf-content" id="nodb-pdf-content">
      <div class="bigip-pdf-header">
        {{#if lsp.logoImage}} <img src="{{lsp.logoImage.base64Image}}" /> {{/if}}
        <p><b>  Translation Estimate for&nbsp;{{request.no}} </b></p>
      </div>
      <div class="bigip-pdf-main-info">
        <span><b>Request No.:</b> {{request.no}} </span> 
        <span><b>Reference No.:</b> {{request.referenceNumber}} </span> 
        <span><b>Project Type:</b> Direct Filing / Paris Convention Translation</span> 
        <span><b>Applicant:</b> {{ipPatent.applicantName}} </span> 
        <span class="bigip-pdf-validation-deadline-header"><b>Filing Deadline:</b> {{#formatDate ipPatent.fililngDeadline 'DD/MM/YY'}} {{/formatDate}} </span> 
      </div>
      <div class="bigip-pdf-country-table-container">        
        <table class="bigip-pdf-instant-quote-table">
          <thead>
            <tr>
              <th class="bigip-pdf-country-header">COUNTRY</th>
              <th class="bigip-pdf-country-header">AGENCY FEE</th>
              <th class="bigip-pdf-country-header">OFFICIAL FEE</th>
              <th>TRANSLATION&nbsp;FEE</th>
              <th class="bigip-pdf-country-header">TOTAL</th>
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
                  <td colspan="4" class="bigip-pdf-align-right">
                    Our team is preparing your customized quote
                  </td>
                {{/if}}
              </tr>
            {{/each}}
          </tbody>
        </table>
        <div class="bigip-pdf-total">
          <b>
            <span>TOTAL: </span>
            <span>{{requestCurrency}} {{#numberToCurrency ipPatent.total 2}} {{/numberToCurrency}}</span>
          </b>
        </div>
      </div>
      <div class="bigip-pdf-body__bullets">
        <p>Please note the following:</p>
        {{#each ipPatent.disclaimers}}
          <p> • {{this}} </p>
        {{/each}}</div>
      </div>
    <div id="nodb-pdf-footer" class="bigip-pdf-footer">
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
