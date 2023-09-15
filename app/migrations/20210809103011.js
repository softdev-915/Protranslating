const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const TRANSLATION_ONLY_TEMPLATE_NODB = {
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
                <td>{{../requestCurrencySymbol}} {{#numberToCurrency translationFee 2}} {{/numberToCurrency}}</td>
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

const FILLING_TEMPLATE_NODB = {
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
                  <td>{{../requestCurrencySymbol}} {{#numberToCurrency agencyFee 2}} {{/numberToCurrency}} </td>
                  <td>{{../requestCurrencySymbol}} {{#numberToCurrency officialFee 2}} {{/numberToCurrency}} </td>
                  <td>{{../requestCurrencySymbol}} {{#numberToCurrency translationFee 2}} {{/numberToCurrency}} </td>
                  <td>{{../requestCurrencySymbol}} {{#numberToCurrency total 2}} {{/numberToCurrency}} </td>
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

const TRANSLATION_ONLY_TEMPLATE_EPO = {
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
                <td>{{../requestCurrencySymbol}} {{#numberToCurrency translationFee 2}} {{/numberToCurrency}}</td>
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

const FILLING_TEMPLATE_EPO = {
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
                <td>{{../requestCurrencySymbol}} {{#numberToCurrency agencyFeeFixed 2}} {{/numberToCurrency}} </td>
                <td>{{../requestCurrencySymbol}} {{#numberToCurrency officialFee 2}} {{/numberToCurrency}} </td>
                <td>{{../requestCurrencySymbol}} {{#numberToCurrency translationFee 2}} {{/numberToCurrency}} </td>
                <td>{{../requestCurrencySymbol}} {{#numberToCurrency total 2}} {{/numberToCurrency}} </td>
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

const TRANSLATION_ONLY_TEMPLATE_WIPO = {
  name: 'PCTNationalPhase_TranslationOnly-LMS96',
  type: 'Quote',
  template: `
  <div class="bigip-pdf" id="wipo-pdf">
    <div class="bigip-pdf-content" id="wipo-pdf-content">
      <div class="bigip-pdf-header">
          {{#if lsp.logoImage}} <img src='{{lsp.logoImage.base64Image}}' width="200px"> {{/if}}
          <p><b> <u> Translation Estimate for {{ipPatent.patentApplicationNumber}} </u></b></p>
      </div>
      <div class="bigip-pdf-main-info">
        <span><b>Patent Title:</b> {{ipPatent.title}} </span> 
        <span><b>Patent Application No.:</b> {{ipPatent.patentApplicationNumber}} </span> 
        <span><b>Patent Publication No.:</b> {{ipPatent.patentPublicationNumber}} </span> 
        <span><b>Applicant:</b> {{ipPatent.applicantName}} </span> 
        <span class="bigip-pdf-validation-deadline-header"><b>30 Month Deadline:</b> {{#formatDate ipPatent.thirtyMonthsDeadline 'DD/MM/YY'}} {{/formatDate}} </span> 
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
                {{#if instantQuote}}
                <td>{{../requestCurrencySymbol}} {{#numberToCurrency translationFee 2}} {{/numberToCurrency}} </td>
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
            <span>{{requestCurrency}} {{#numberToCurrency ipPatent.total 2}} {{/numberToCurrency}} </span>
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
    <div class="bigip-pdf-footer" id="wipo-pdf-footer">
      <span>{{lsp.phoneNumber}}</span>
      <span>{{lsp.addressInformation.line1}}, {{lsp.addressInformation.line2}}, {{lsp.addressInformation.city}}, {{lsp.addressInformation.state.name}} {{lsp.addressInformation.zip}}</span>
      <span>www.BIG-IP.com</span>
    </div>
  </div>
`,
};

const FILING_TEMPLATE_WIPO = {
  name: 'PCTNationalPhase_TranslationAndFiling-LMS96',
  type: 'Quote',
  template: `
  <div class="bigip-pdf" id="wipo-pdf">
    <div class="bigip-pdf-content" id="wipo-pdf-content">
      <div class="bigip-pdf-header">
          {{#if lsp.logoImage}} <img src='{{lsp.logoImage.base64Image}}' width="200px"> {{/if}}
          <p><b> <u> Translation Estimate for {{ipPatent.patentApplicationNumber}} </u></b></p>
      </div>
      <div class="bigip-pdf-main-info">
        <span><b>Patent Title:</b> {{ipPatent.title}} </span> 
        <span><b>Patent Application No.:</b> {{ipPatent.patentApplicationNumber}} </span> 
        <span><b>Patent Publication No.:</b> {{ipPatent.patentPublicationNumber}} </span> 
        <span><b>Applicant:</b> {{ipPatent.applicantName}} </span> 
        <span class="validation-deadline-header"><b>30 Month Deadline:</b> {{#formatDate ipPatent.thirtyMonthsDeadline 'DD/MM/YY'}} {{/formatDate}} </span> 
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
                  <td>{{../requestCurrencySymbol}} {{#numberToCurrency agencyFee 2}} {{/numberToCurrency}} </td>
                  <td>{{../requestCurrencySymbol}} {{#numberToCurrency officialFee 2}} {{/numberToCurrency}} </td>
                  <td>{{../requestCurrencySymbol}} {{#numberToCurrency translationFee 2}} {{/numberToCurrency}} </td>
                  <td>{{../requestCurrencySymbol}} {{#numberToCurrency total 2}} {{/numberToCurrency}} </td>
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
        {{/each}}
      </div>
    </div>
    <div class="bigip-pdf-footer" id="wipo-pdf-footer">
      <span>{{lsp.phoneNumber}}</span>
      <span>{{lsp.addressInformation.line1}}, {{lsp.addressInformation.line2}}, {{lsp.addressInformation.city}}, {{lsp.addressInformation.state.name}} {{lsp.addressInformation.zip}}</span>
      <span>www.BIG-IP.com</span>
    </div>
  </div>
`,
};
const TEMPLATES = [
  TRANSLATION_ONLY_TEMPLATE_NODB,
  FILLING_TEMPLATE_NODB,
  TRANSLATION_ONLY_TEMPLATE_EPO,
  FILLING_TEMPLATE_EPO,
  TRANSLATION_ONLY_TEMPLATE_WIPO,
  FILING_TEMPLATE_WIPO,
];
const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const templatesCol = db.collection('templates');
    const lspCol = db.collection('lsp');
    return Promise.each(TEMPLATES, template => lspCol.findOne({ name: 'BIG IP' })
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
