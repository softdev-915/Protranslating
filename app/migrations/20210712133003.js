const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const TRANSLATION_ONLY_TEMPLATE = {
  name: 'EPValidation_TranslationOnly-LMS96',
  type: 'Quote',
  template: `
  <div class="bigip-pdf" id="epo-pdf">
    <div class="bigip-pdf-content" id="epo-pdf-content">
      <div class="bigip-pdf-header">
          {{#if lsp.logoImage}} <img src='{{lsp.logoImage.base64Image}}' width="200px"> {{/if}}
          <p><b> <u> Translation Estimate for {{ipPatent.patentPublicationNumber}} </u></b></p>
      </div>
      <div class="bigip-pdf-main-info">
        <span><b>Patent Title:</b> {{ipPatent.title}} </span> 
        <span><b>Patent Application No.:</b> {{ipPatent.patentApplicationNumber}} </span> 
        <span><b>Patent Publication No.:</b> {{ipPatent.patentPublicationNumber}} </span> 
        <span><b>Applicant:</b> {{ipPatent.applicantName}} </span> 
        <span class="bigip-pdf-validation-deadline-header"><b>Validation Deadline:</b> {{#formatDate ipPatent.validationDeadline 'DD/MM/YY'}} {{/formatDate}} </span> 
      </div>
      <div class="bigip-pdf-country-table-container no-filing">
        <table class="bigip-pdf-instant-quote-table">
          <thead>
            <tr>
              <th class="bigip-pdf-country-header">COUNTRY</th>
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
        {{#compare ipPatent.kind '!==' 'B1'}}
        <p>
          •  As B1 is not available these values are being calculated from {{epo.kind}}
        </p>
        {{/compare}}
      </div>
    </div>
    <div class="bigip-pdf-footer" id="epo-pdf-footer">
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
  <div class="bigip-pdf" id="epo-pdf">
    <div class="bigip-pdf-content" id="epo-pdf-content">
      <div class="bigip-pdf-header">
          {{#if lsp.logoImage}} <img src='{{lsp.logoImage.base64Image}}' width="200px"> {{/if}}
          <p><b> <u> Translation Estimate for {{ipPatent.patentPublicationNumber}} </u></b></p>
      </div>
      <div class="bigip-pdf-main-info">
        <span><b>Patent Title:</b> {{ipPatent.title}} </span> 
        <span><b>Patent Application No.:</b> {{ipPatent.patentApplicationNumber}} </span> 
        <span><b>Patent Publication No.:</b> {{ipPatent.patentPublicationNumber}} </span> 
        <span><b>Applicant:</b> {{ipPatent.applicantName}} </span> 
        <span class="bigip-pdf-validation-deadline-header"><b>Validation Deadline:</b> {{#formatDate ipPatent.validationDeadline 'DD/MM/YY'}} {{/formatDate}} </span> 
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
                <td>{{#formatCurrency ../requestCurrency}} {{/formatCurrency}} {{#toFixed agencyFeeFixed 2}} {{/toFixed}} </td>
                <td>{{#formatCurrency ../requestCurrency}} {{/formatCurrency}} {{#toFixed officialFee 2}} {{/toFixed}} </td>
                <td>{{#formatCurrency ../requestCurrency}} {{/formatCurrency}} {{#toFixed translationFee 2}} {{/toFixed}} </td>
                <td>{{#formatCurrency ../requestCurrency}} {{/formatCurrency}} {{#toFixed total 2}} {{/toFixed}} </td>
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
        {{#compare ipPatent.kind '!==' 'B1'}}
        <p>
          •  As B1 is not available these values are being calculated from {{epo.kind}}
        </p>
        {{/compare}}
      </div>
    </div>
    <div class="bigip-pdf-footer" id="epo-pdf-footer">
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
