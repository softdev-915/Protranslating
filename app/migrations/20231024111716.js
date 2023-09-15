const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const TRANSLATION_ONLY_TEMPLATE_WIPO = {
  name: '[#20] BIGIP_PCT_TranslationOnly',
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
          <div class="divTableCell text-right quote-total-column">
            TRANSLATION FEE
          </div>
        </div>
        <div class="divTableBody">
          {{#each ipPatent.countries}}
          <div class="divTableRow">
            <div class="divTableCell">
              <span>{{name}}</span>
            </div>
            {{#if instantQuote}}
            <div class="divTableCell text-right">
              {{../requestCurrencySymbol}} {{#numberToCurrency translationFee 2}} {{/numberToCurrency}}
            </div>
            {{ else }}
              {{#if translationFee}}
                <div class="divTableCell text-right">{{../requestCurrencySymbol}} {{#numberToCurrency translationFee 2}} {{/numberToCurrency}}</div>
              {{else}}
                <div class="divTableCell text-right">Our team is preparing your customized quote</div>
              {{/if}}
            {{/if}}
          </div>
          {{/each}}
        </div>
      </div>
      <div class="divTotalRow no-border">
        <div class="divTableCell text-right">TOTAL</div>
        <div class="divTableCell text-right currency">{{requestCurrency}} {{#numberToCurrency ipPatent.total
          2}}{{/numberToCurrency}}
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
                <div class="divTableCell">
                  {{name}}
                </div>
                <div class="divTableCell text-right">
                  Our team is preparing your customized quote
                </div>
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

const TRANSLATION_ONLY_TEMPLATE_NODB = {
  name: '[#24] BIGIP_DirectFiling_TranslationOnly',
  type: 'Quote',
  template: `
  <div class="bigip-pdf" id="nodb-pdf">
    <div class="bigip-pdf-content" id="nodb-pdf-content">
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
          {{#if request.no}}
          <div class="bigip-quote-detail-item">
            <div class="quote-title">BIG Reference No.</div>
          </div>
          {{/if}}
          <div class="bigip-quote-detail-item">
            <div class="quote-title">Project Type</div>
          </div>
          {{#if ipPatent.applicantName}}
          <div class="bigip-quote-detail-item">
            <div class="quote-title">Applicant</div>
          </div>
          {{/if}} {{#if ipPatent.filingDeadline}}
          <div class="bigip-quote-detail-item">
            <div class="quote-title">Filing Deadline</div>
          </div>
          {{/if}} {{#if request.referenceNumber}}
          <div class="bigip-quote-detail-item">
            <div class="quote-title">Reference No.</div>
          </div>
          {{/if}}
        </div>
        <div class="description">
          {{#if request.no}}
          <div class="bigip-quote-detail-item">
            <div>{{request.no}}</div>
          </div>
          {{/if}}
          <div class="bigip-quote-detail-item">
            <div>Direct Filing / Paris Convention Translation</div>
          </div>
          {{#if ipPatent.applicantName}}
          <div class="bigip-quote-detail-item">
            <div>{{ipPatent.applicantName}}</div>
          </div>
          {{/if}} {{#if ipPatent.filingDeadline}}
          <div class="bigip-quote-detail-item">
            <div>{{#formatDate ipPatent.filingDeadline 'DD/MM/YY'}} {{/formatDate}}</div>
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
          <div class="divTableCell text-right quote-total-column">
            TRANSLATION FEE
          </div>
        </div>
        <div class="divTableBody">
          {{#each ipPatent.countries}}
          <div class="divTableRow">
            <div class="divTableCell">
              <span>{{name}}</span>
            </div>
            {{#if instantQuote}}
              <div class="divTableCell text-right">
                {{../requestCurrencySymbol}} {{#numberToCurrency translationFee 2}} {{/numberToCurrency}}
              </div>
            {{ else }}
              {{#if translationFee}}
                <div class="divTableCell text-right">{{../requestCurrencySymbol}} {{#numberToCurrency translationFee 2}} {{/numberToCurrency}}</div>
              {{else}}
                <div class="divTableCell text-right">Our team is preparing your customized quote</div>
              {{/if}}
            {{/if}}
          </div>
          {{/each}}
        </div>
      </div>
      <div class="divTotalRow no-border">
        <div class="divTableCell text-right">TOTAL</div>
        <div class="divTableCell text-right currency">{{requestCurrency}} {{#numberToCurrency ipPatent.total
          2}}{{/numberToCurrency}}
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

const FILLING_TEMPLATE_NODB = {
  name: '[#25] BIGIP_DirectFiling_TranslationAndFiling',
  type: 'Quote',
  template: `
  <div class="bigip-pdf" id="nodb-pdf">
    <div class="bigip-pdf-content" id="nodb-pdf-content">
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
          {{#if request.no}}
          <div class="bigip-quote-detail-item">
            <div class="quote-title">BIG Reference No.</div>
          </div>
          {{/if}}
          <div class="bigip-quote-detail-item">
            <div class="quote-title">Project Type</div>
          </div>
          {{#if ipPatent.applicantName}}
          <div class="bigip-quote-detail-item">
            <div class="quote-title">Applicant</div>
          </div>
          {{/if}} {{#if ipPatent.filingDeadline}}
          <div class="bigip-quote-detail-item">
            <div class="quote-title">Filing Deadline</div>
          </div>
          {{/if}} {{#if request.referenceNumber}}
          <div class="bigip-quote-detail-item">
            <div class="quote-title">Reference No.</div>
          </div>
          {{/if}}
        </div>
        <div class="description">
          {{#if request.no}}
          <div class="bigip-quote-detail-item">
            <div>{{request.no}}</div>
          </div>
          {{/if}}
          <div class="bigip-quote-detail-item">
            <div>Direct Filing / Paris Convention Translation</div>
          </div>
          {{#if ipPatent.applicantName}}
          <div class="bigip-quote-detail-item">
            <div>{{ipPatent.applicantName}}</div>
          </div>
          {{/if}} {{#if ipPatent.filingDeadline}}
          <div class="bigip-quote-detail-item">
            <div>{{#formatDate ipPatent.filingDeadline 'DD/MM/YY'}} {{/formatDate}}</div>
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
              <div class="divTableCell">
                {{name}}
              </div>
              <div class="divTableCell text-right">
                Our team is preparing your customized quote
              </div>
            </div>
            <div class="emptyRow"></div>
          {{/if}} {{/if}} {{/each}}
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

const TEMPLATES = [
  TRANSLATION_ONLY_TEMPLATE_WIPO,
  FILING_TEMPLATE_WIPO,
  TRANSLATION_ONLY_TEMPLATE_NODB,
  FILLING_TEMPLATE_NODB,
];

const newEpoDisclaimer = {
  countries: ['ALL'],
  codes: [],
  filingLanguage: '',
  sameTranslation: false,
  disclaimer: 'Austria, Bulgaria, Hungary, Poland, Romania, San Marino & Spain: as the official fees are calculated based on the number of pages of the translation as validated, the final official fees may be subject to change.',
  rule: '',
  translationOnly: false,
  translationAndFiling: true,
};

const migration = async () => {
  const connections = await mongo.connect(configuration);
  const db = connections.mongoose.connection;
  const templatesCol = db.collection('templates');
  const lsp = db.collection('lsp');
  const bigIp = await lsp.findOne({ name: 'BIG IP' });
  const epoDisclaimers = db.collection('ip_epo_disclaimers');

  if (_.isNil(bigIp)) return;

  await epoDisclaimers.insertOne(newEpoDisclaimer);
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
