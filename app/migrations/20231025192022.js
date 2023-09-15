const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const FILLING_TEMPLATE_EPO = {
  name: '[#23] BIGIP_EP_TranslationAndFiling',
  type: 'Quote',
  template: `
  <div class="bigip-pdf" id="epo-pdf">
    <div class="bigip-pdf-content" id="epo-pdf-content">
      <div id="bigip-pdf-header">
        <div class="bigip-pdf-header-bar"></div>
        <div class="bigip-header-container">
          <div>
            {{#if templateLogo}}
            <img src="{{templateLogo}}"> {{/if}}
          </div>
          <div class="bigip-quote-header">
            <h4>Quote</h4>
            <span># {{request.no}}</span>
          </div>
        </div>
      </div>
      <div class="bigip-pdf-main-info">
        <div class="label">
          {{#if ipPatent.title}}
          <div class="bigip-quote-detail-item">
            <div class="quote-title">Patent Title</div>
          </div>
          {{/if}} {{#if ipPatent.patentApplicationNumber}}
          <div class="bigip-quote-detail-item">
            <div class="quote-title">Patent App. No.</div>
          </div>
          {{/if}} {{#if ipPatent.patentPublicationNumber}}
          <div class="bigip-quote-detail-item">
            <div class="quote-title">Patent Pub. No.</div>
          </div>
          {{/if}} {{#if ipPatent.applicantName}}
          <div class="bigip-quote-detail-item">
            <div class="quote-title">Applicant</div>
          </div>
          {{/if}} {{#if ipPatent.validationDeadline}}
          <div class="bigip-quote-detail-item">
            <div class="quote-title">Validation Deadline</div>
          </div>
          {{/if}} {{#if request.referenceNumber}}
          <div class="bigip-quote-detail-item">
            <div class="quote-title">Reference No.</div>
          </div>
          {{/if}}
        </div>
        <div class="description">
          {{#if ipPatent.title}}
          <div class="bigip-quote-detail-item">
            <div>{{ipPatent.title}}</div>
          </div>
          {{/if}} {{#if ipPatent.patentApplicationNumber}}
          <div class="bigip-quote-detail-item">
            <div>{{ipPatent.patentApplicationNumber}}</div>
          </div>
          {{/if}} {{#if ipPatent.patentPublicationNumber}}
          <div class="bigip-quote-detail-item">
            <div>{{ipPatent.patentPublicationNumber}}</div>
          </div>
          {{/if}} {{#if ipPatent.applicantName}}
          <div class="bigip-quote-detail-item">
            <div>{{ipPatent.applicantName}}</div>
          </div>
          {{/if}} {{#if ipPatent.validationDeadline}}
          <div class="bigip-quote-detail-item">
            <div>{{#formatDate ipPatent.validationDeadline 'DD/MM/YY'}} {{/formatDate}}</div>
          </div>
          {{/if}} {{#if request.referenceNumber}}
          <div class="bigip-quote-detail-item">
            <div>{{request.referenceNumber}}</div>
          </div>
          {{/if}}
        </div>
      </div>
      <div class="divTable auto-width-table">
        <div class="divTableHeader divTableRow">
          <div class="divTableCell">
            COUNTRY
          </div>
          <div class="divTableCell text-right">
            AGENCY FEE
          </div>
          <div class="divTableCell text-right">
            OFFICIAL FEE
          </div>
          <div class="divTableCell text-right">
            TRANSLATION FEE
          </div>
          <div class="divTableCell text-right quote-total-column">
            TOTAL
          </div>
        </div>
        <div class="divTableBody">
          {{#each ipPatent.countries}}
          {{#eq name 'Annuity Payment'}}
          <div class="subCountryRow">
            <div class="divTableCell" data-e2e-type="annuity-payment-cell">
              {{name}}
            </div>
            <div class="divTableCell text-right">
              This will be sent to you in a separate email
            </div>
          </div>
          {{/eq}}
          {{#isnt name 'Annuity Payment'}}
          <div class="divTableRow">
            <div class="divTableCell">
              <span>{{name}}</span>
            </div>
            <div class="divTableCell text-right">
              {{../requestCurrencySymbol}} {{#numberToCurrency agencyFeeFixed 2}} {{/numberToCurrency}}
            </div>
            <div class="divTableCell text-right">
              {{../requestCurrencySymbol}} {{#numberToCurrency officialFee 2}} {{/numberToCurrency}}
            </div>
            <div class="divTableCell text-right">
              {{../requestCurrencySymbol}} {{#numberToCurrency translationFee 2}} {{/numberToCurrency}}
            </div>
            <div class="divTableCell text-right">
              {{../requestCurrencySymbol}} {{#numberToCurrency total 2}} {{/numberToCurrency}}
            </div>
          </div>
          {{/isnt}}
          {{/each}}
          <div class="emptyRow"></div>
          <div class="divTableRow divTotalRow no-border">
            <div class="divTableCell"></div>
            <div class="divTableCell"></div>
            <div class="divTableCell"></div>
            <div class="divTableCell text-right">TOTAL</div>
            <div class="divTableCell text-right currency">{{requestCurrency}} {{#numberToCurrency ipPatent.total
              2}}{{/numberToCurrency}}</div>
          </div>
        </div>
      </div>
      <div class="thank-you">
        Thank you for the opportunity to provide you with an estimate.
      </div>
      <div class="notes-container">
        {{#if request.comments }}
        <h4>NOTES</h4>
        <span>
          <span></span> {{#each ipPatent.disclaimers}}
          <div><span> • {{this}} </span></div>
          {{/each}}
        </span>
        {{/if}}
      </div>
    </div>
  </div>
`,
};

const FILING_TEMPLATE_WIPO = {
  name: '[#21] BIGIP_PCT_TranslationAndFiling',
  type: 'Quote',
  template: `
  <div class="bigip-pdf" id="wipo-pdf">
    <div class="bigip-pdf-content" id="wipo-pdf-content">
      <div id="bigip-pdf-header">
        <div class="bigip-pdf-header-bar"></div>
        <div class="bigip-header-container">
          <div>
            {{#if templateLogo}}
            <img src="{{templateLogo}}"> {{/if}}
          </div>
          <div class="bigip-quote-header">
            <h4>Quote</h4>
            <span># {{request.no}}</span>
          </div>
        </div>
      </div>
      <div class="bigip-pdf-main-info">
        <div class="label">
          {{#if ipPatent.title}}
          <div class="bigip-quote-detail-item">
            <div class="quote-title">Patent Title</div>
          </div>
          {{/if}} {{#if ipPatent.patentApplicationNumber}}
          <div class="bigip-quote-detail-item">
            <div class="quote-title">Patent App. No.</div>
          </div>
          {{/if}} {{#if ipPatent.patentPublicationNumber}}
          <div class="bigip-quote-detail-item">
            <div class="quote-title">Patent Pub. No.</div>
          </div>
          {{/if}} {{#if ipPatent.applicantName}}
          <div class="bigip-quote-detail-item">
            <div class="quote-title">Applicant</div>
          </div>
          {{/if}} {{#if ipPatent.thirtyMonthsDeadline}}
          <div class="bigip-quote-detail-item">
            <div class="quote-title">30 Month Deadline</div>
          </div>
          {{/if}} {{#if request.referenceNumber}}
          <div class="bigip-quote-detail-item">
            <div class="quote-title">Reference No.</div>
          </div>
          {{/if}}
        </div>
        <div class="description">
          {{#if ipPatent.title}}
          <div class="bigip-quote-detail-item">
            <div>{{ipPatent.title}}</div>
          </div>
          {{/if}} {{#if ipPatent.patentApplicationNumber}}
          <div class="bigip-quote-detail-item">
            <div>{{ipPatent.patentApplicationNumber}}</div>
          </div>
          {{/if}} {{#if ipPatent.patentPublicationNumber}}
          <div class="bigip-quote-detail-item">
            <div>{{ipPatent.patentPublicationNumber}}</div>
          </div>
          {{/if}} {{#if ipPatent.applicantName}}
          <div class="bigip-quote-detail-item">
            <div>{{ipPatent.applicantName}}</div>
          </div>
          {{/if}} {{#if ipPatent.thirtyMonthsDeadline}}
          <div class="bigip-quote-detail-item">
            <div>{{#formatDate ipPatent.thirtyMonthsDeadline 'DD/MM/YY'}} {{/formatDate}}</div>
          </div>
          {{/if}} {{#if request.referenceNumber}}
          <div class="bigip-quote-detail-item">
            <div>{{request.referenceNumber}}</div>
          </div>
          {{/if}}
        </div>
      </div>
      <div class="divTable auto-width-table">
        <div class="divTableHeader divTableRow">
          <div class="divTableCell">
            COUNTRY
          </div>
          <div class="divTableCell text-right">
            AGENCY FEE
          </div>
          <div class="divTableCell text-right">
            OFFICIAL FEE
          </div>
          <div class="divTableCell text-right">
            TRANSLATION FEE
          </div>
          <div class="divTableCell text-right quote-total-column">
            TOTAL
          </div>
        </div>
        <div class="divTableBody">
          {{#each ipPatent.countries}} {{#if instantQuote}}
          <div class="divTableRow">
            <div class="divTableCell">
              <span>{{name}}</span>
            </div>
            <div class="divTableCell text-right">
              {{../requestCurrencySymbol}} {{#numberToCurrency agencyFee 2}} {{/numberToCurrency}}
            </div>
            <div class="divTableCell text-right">
              {{../requestCurrencySymbol}} {{#numberToCurrency officialFee 2}} {{/numberToCurrency}}
            </div>
            <div class="divTableCell text-right">
              {{../requestCurrencySymbol}} {{#numberToCurrency translationFee 2}} {{/numberToCurrency}}
            </div>
            <div class="divTableCell text-right">
              {{../requestCurrencySymbol}} {{#numberToCurrency total 2}} {{/numberToCurrency}}
            </div>
          </div>
          {{else}}
            {{#if total}}
              <div class="divTableRow">
                <div class="divTableCell">
                  <span>{{name}}</span>
                </div>
                <div class="divTableCell text-right">
                  {{../requestCurrencySymbol}} {{#numberToCurrency agencyFee 2}} {{/numberToCurrency}}
                </div>
                <div class="divTableCell text-right">
                  {{../requestCurrencySymbol}} {{#numberToCurrency officialFee 2}} {{/numberToCurrency}}
                </div>
                <div class="divTableCell text-right">
                  {{../requestCurrencySymbol}} {{#numberToCurrency translationFee 2}} {{/numberToCurrency}}
                </div>
                <div class="divTableCell text-right">
                  {{../requestCurrencySymbol}} {{#numberToCurrency total 2}} {{/numberToCurrency}}
                </div>
              </div>
            {{else}}
              <div class="subCountryRow">
                {{#eq name 'Annuity Payment' }}
                <div class="divTableCell" data-e2e-type="annuity-payment-cell">
                  {{name}}
                </div>
                <div class="divTableCell text-right">
                  This will be sent to you in a separate email
                </div>
                {{/eq}}
                {{#isnt name 'Annuity Payment' }}
                <div class="divTableCell">
                  {{name}}
                </div>
                <div class="divTableCell text-right">
                  Our team is preparing your customized quote
                </div>
                {{/isnt}}
              </div>
              <div class="emptyRow"></div>
          {{/if}} {{/if}} {{/each}}
          <div class="divTableRow divTotalRow no-border">
            <div class="divTableCell"></div>
            <div class="divTableCell"></div>
            <div class="divTableCell"></div>
            <div class="divTableCell text-right">TOTAL</div>
            <div class="divTableCell text-right currency">{{requestCurrency}} {{#numberToCurrency ipPatent.total 2}}
              {{/numberToCurrency}}
            </div>
          </div>
        </div>
      </div>
      <div class="thank-you">
        Thank you for the opportunity to provide you with an estimate.
      </div>
      <div class="notes-container">
        {{#if request.comments }}
        <h4>NOTES</h4>
        <span>
          <span></span> {{#each ipPatent.disclaimers}}
          <div><span> • {{this}} </span></div>
          {{/each}}
        </span>
        {{/if}}
      </div>
    </div>
  </div>
`,
};
const TEMPLATES = [
  FILLING_TEMPLATE_EPO,
  FILING_TEMPLATE_WIPO,
];
const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const templatesCol = db.collection('templates');
  const lsp = db.collection('lsp');
  const bigIp = await lsp.findOne({ name: 'BIG IP' });
  if (_.isNil(bigIp)) return Promise.resolve();
  return Promise.each(TEMPLATES, template =>
    templatesCol.updateOne(
      {
        name: template.name,
        lspId: bigIp._id,
      },
      {
        $set: {
          template: template.template,
          lspId: bigIp._id,
        },
      },
      { upsert: true },
    ));
};

if (require.main === module) {
  migration()
    .then(() => process.exit(0))
    .catch((err) => {
      throw err;
    });
} else {
  module.exports = migration;
}
