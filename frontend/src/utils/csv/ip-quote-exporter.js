/* global document window Blob */
import _ from 'lodash';
import moment from 'moment-timezone';

const DATE_FORMAT = 'MMM D YYYY';
const DEADLINE_PROPS = ['thirtyMonthsDeadline', 'validationDeadline', 'filingDeadline'];
const DIRECT_FILLING = 'Direct Filing/Paris Convention';
const TRANSLATION_ONLY_SERVICE = 'Patent Translation Quote';
const CUSTOMIZED_QUOTE_MESSAGE = 'Our team is preparing your customized quote';
const CLAIMS_ESTIMATE_HEADER = 'Translation Estimate for 71(3) Claims';
const sanitizeString = str => str.replace(/,/g, '');
const formatDate = date => moment(date).format(DATE_FORMAT);
const getProp = (data, props, transform) => {
  for (const prop of props) {
    if (_.has(data, prop)) {
      return _.isFunction(transform) ? transform(data[prop]) : data[prop];
    }
  }
};
export default class IpQuoteCsvExporter {
  constructor(data) {
    this.data = data;
    this.rows = [];
  }

  export(fileName) {
    this.createCsvRows();

    const csvString = this.rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'application/csv' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${fileName}.csv`;
    link.click();
  }

  createCsvRows() {
    this.createQuoteInfoRows();
    this.createCountriesRows();
    this.createTotalRow();
  }

  get currency() {
    return this.data.quoteCurrency;
  }

  get isDirectFilling() {
    return this.data.ipPatent.database === DIRECT_FILLING;
  }

  get isTranlsationOnlyService() {
    return this.data.ipPatent.service === TRANSLATION_ONLY_SERVICE;
  }

  get isWipo() {
    return _.get(this.data, 'ipPatent.patentApplicationNumber', '').includes('PCT');
  }

  get dealinePropName() {
    if (this.isWipo) {
      return '30 Month Deadline';
    }
    return this.isDirectFilling ? 'Filling Deadline' : 'Validation Deadline';
  }

  get countriesHeaders() {
    return this.isTranlsationOnlyService
      ? ['Country', 'Translation Fee']
      : ['Country', 'Agency Fee', 'Official Fee', 'Translation Fee', 'Total'];
  }

  get claimsTranslationGranted() {
    return this.data.ipPatent.claimsTranslationGranted;
  }

  createQuoteInfoRows() {
    const csv = {
      'BIG Reference No.': this.data.no,
    };
    if (this.isDirectFilling) {
      csv['Project Type'] = DIRECT_FILLING;
      csv.Applicant = getProp(this.data.ipPatent, ['applicantName'], sanitizeString);
    } else {
      csv['Patent Title'] = getProp(this.data.ipPatent, ['title'], sanitizeString);
      csv['Patent App. No.'] = getProp(this.data.ipPatent, ['patentApplicationNumber'], sanitizeString);
      csv['Patent Pub. No.'] = getProp(this.data.ipPatent, ['patentPublicationNumber'], sanitizeString);
      csv.Applicant = getProp(this.data.ipPatent, ['applicantName'], sanitizeString);
    }
    csv[this.dealinePropName] = getProp(this.data.ipPatent, DEADLINE_PROPS, formatDate);

    Object.entries(csv).forEach((entry) => {
      if (!_.isNil(entry[1])) {
        this.rows.push(entry);
      }
    });
  }

  createCountriesRows() {
    const feeHeaders = [];
    const claimsTranslationFees = _.get(this.data.ipPatent, 'claimsTranslationFees', [])
      .map(claim => this._transformClaims(claim));
    const countriesFees = _.get(this.data.ipPatent, 'countries', [])
      .map(country => this._transformCounty(country));
    const feeLength = _.max([claimsTranslationFees.length, countriesFees.length]);
    const hasClaimsInReport = claimsTranslationFees.length > 0;
    const hasCountriesInReport = countriesFees.length > 0;
    this.rows.push([]);

    if (this.claimsTranslationGranted) {
      const claimHeaders = [];
      if (hasClaimsInReport) {
        claimHeaders.push(CLAIMS_ESTIMATE_HEADER, '');
        feeHeaders.push('Language', 'Translation Fee', '');
      }
      if (hasCountriesInReport) {
        claimHeaders.push(
          '',
          `Translation Estimate for ${this.data.ipPatent.patentPublicationNumber}`
        );
      }
      this.rows.push(claimHeaders);
    }

    if (hasCountriesInReport) {
      feeHeaders.push(...this.countriesHeaders);
    }
    this.rows.push(feeHeaders);
    for (let i = 0; i < feeLength; i++) {
      const newRow = [];
      const claimRow = claimsTranslationFees[i];
      const countryRow = countriesFees[i];
      const hasClaimInRow = !_.isNil(claimRow);
      const hasCountryInRow = !_.isNil(countryRow);

      if (hasClaimInRow) {
        newRow.push(...claimRow, '');
      } else if (hasClaimsInReport) {
        newRow.push('', '', '');
      }

      if (hasCountryInRow) {
        newRow.push(...countryRow);
      }
      this.rows.push(newRow);
    }
  }

  createTotalRow() {
    const total = _.get(this.data, 'ipPatent.total');

    if (!_.isNil(total)) {
      this.rows.push([]);
      this.rows.push(['Total', `${this.currency.isoCode} ${total}`]);
    }
  }

  _transformCounty(country) {
    const row = [country.name];

    if (country.instantQuote === false && !country.total) {
      row.push(CUSTOMIZED_QUOTE_MESSAGE);
      return row;
    }

    const translationFee = getProp(country, ['translationFee']);
    if (this.isTranlsationOnlyService) {
      row.push(translationFee);
      return row;
    }

    row.push(getProp(country, ['agencyFee', 'agencyFeeFixed']));
    row.push(getProp(country, ['officialFee']));
    row.push(translationFee);
    row.push(getProp(country, ['total']));
    return row;
  }

  _transformClaims(claim) {
    return [claim.language, claim.calculatedFee];
  }

  _prependWithIsoCode(amount) {
    return `${this.currency.isoCode} ${amount}`;
  }
}
