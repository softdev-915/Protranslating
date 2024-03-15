/* eslint-disable arrow-parens */
import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import EpoMixin from './epo/epo-mixin';
import IpQuoteHelperMixin from './ip-quote-helper-mixin';
import IpQuoteTrackingMixin from './ip-wizard-tracking-mixin';
import { LANG_ISO_CODES_CONVERSION, extendLanguageCombinations } from './helpers';

export default {
  mixins: [EpoMixin, IpQuoteHelperMixin, IpQuoteTrackingMixin],
  data: () => ({
    claimsTranslationGranted: false,
    isValidClaimsTranslation: true,
    orderDetails: {},
    requestNumber: '',
    isValidOrderDetails: true,
  }),
  async created() {
    this.quoteDetailsTitle = 'Your Quote Details';
    this.service = this.translationOnly ? 'Patent Translation Quote' : 'Patent Translation and Filing Quote';
    this.database = this.translationOnly ? 'EP Validation/Claims in response to 71(3)' : 'EP Validation';
  },
  watch: {
    showSavedQuoteModal(newValue, oldValue) {
      this.onQuotePopupClose(newValue, oldValue);
    },
    showExportQuoteModal(newValue, oldValue) {
      this.onQuotePopupClose(newValue, oldValue);
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'lsp']),
    isSecondStepFilled() {
      return this.translationOnly
        ? this.validateSecondPatent() : this.validateSecondPatentAndFiling();
    },
    trackingCombo() {
      return this.translationOnly ? 'C2' : 'C5';
    },
    isLastStep() {
      return this.currentStep === this.maxSteps - 1;
    },
    showBackButton() {
      if (!this.isNew && this.currentStep <= 1) {
        return false;
      }
      return true;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onQuotePopupClose(newValue, oldValue) {
      if (!newValue && oldValue) {
        this.onCloseQuotePopup();
      }
    },
    trackSubmit() {
      this.trackSubmitQuote(this.trackingCombo);
    },
    feeTotal(fee) {
      const { isoCode } = this.quoteCurrency;
      return (
        fee.agencyFeeFixed[isoCode]
            + Number(fee.calculatedFee[isoCode])
            + fee.officialFee[isoCode]
      );
    },
    onClaimsTranslationValidation(isValidClaimsTranslation) {
      this.isValidClaimsTranslation = isValidClaimsTranslation;
    },
    prepareRequest(isApproved) {
      const srcLang = this.epo.sourceLanguage ? this.epo.sourceLanguage : 'EN';
      const patentSrcLangName = LANG_ISO_CODES_CONVERSION[srcLang];
      const patentSrcLang = this.languages.find(l => l.isoCode === patentSrcLangName);
      const languageCombinations = this.getLanguageCombinations(patentSrcLang);
      const rawOtherLanguages = _.get(this.epo, 'otherLanguages', []);
      const otherLanguages = rawOtherLanguages.filter(l => l.selected);
      extendLanguageCombinations({
        languages: this.languages, otherLanguages, languageCombinations, patentSrcLang,
      });
      const { isoCode: currencyIsoCode } = this.quoteCurrency;
      const requestCountries = this.translationFees.map(fee => {
        const countryFound = _.find(this.countriesSelected, c => c.name === fee.country);
        const ipCountry = {
          name: fee.country,
          sourceLanguage: patentSrcLang.name,
          officialLanguage: fee.officialFilingLanguage,
          translationFee: _.toNumber(fee.calculatedFee[currencyIsoCode]),
        };
        if (!this.translationOnly) {
          ipCountry.agencyFeeFixed = _.toNumber(fee.agencyFeeFixed[currencyIsoCode]);
          ipCountry.officialFee = _.toNumber(fee.officialFee[currencyIsoCode]);
          ipCountry.total = _.toNumber(this.feeTotal(fee));
        }
        return {

          ..._.omitBy(_.pick(countryFound, ['extensionState', 'memberState', 'validationState']), (prop) => !prop),
          ...ipCountry,
        };
      });
      if (this.epo.isAnnuityQuotationRequired) {
        requestCountries.push({ name: 'Annuity Payment' });
      }
      const claimsTranslationFees = this.claimsTranslationFees.map(fee => ({
        language: fee.language,
        calculatedFee: _.toNumber(fee.calculatedFee[currencyIsoCode]),
      }));
      const statutoryDeadline = this.epo.statutoryDeadline
        ? this.formatDate(this.epo.statutoryDeadline) : '';
      const ipPatent = {
        service: this.service,
        database: this.database,
        title: this.epo.title,
        patentApplicationNumber: this.epo.patentApplicationNumber.toString(),
        patentPublicationNumber: this.epo.patentPublicationNumber,
        sourceLanguage: patentSrcLang.name,
        applicantName: this.epo.applicantName,
        descriptionWordCount: this.epo.descriptionWordCount,
        claimsWordCount: this.epo.claimWordCount,
        drawingsPageCount: this.epo.drawingsPageCount,
        descriptionPageCount: this.epo.descriptionPageCount,
        numberOfClaims: this.epo.numberOfClaims,
        claimsPageCount: this.epo.claimsPageCount,
        countries: requestCountries,
        claimsTranslationFees,
        claimsTranslationGranted: this.claimsTranslationGranted,
        total: +this.totalFee,
        otherLanguages,
        statutoryDeadline: statutoryDeadline,
        requestedDeliveryDateClaimsTranslation:
          this.formatDate(this.epo.requestedDeliveryDateClaimsTranslation),
        disclaimers: this.disclaimers.map(d => d.disclaimer),
        kind: this.epo.kind,
        validationDeadline: this.epo.validationDeadline,
      };
      if (!this.isOrder && !this.translationOnly) {
        ipPatent.isAnnuityQuotationRequired = this.epo.isAnnuityQuotationRequired;
      }
      if (this.epo.drawingsWordCount) ipPatent.drawingsWordCount = this.epo.drawingsWordCount;
      const request = {
        isQuoteApproved: isApproved,
        requestType: this.requestType,
        title: this.epo.title,
        requireQuotation: true,
        deliveryDate: this.epo.requestedDeliveryDate,
        languageCombinations: languageCombinations,
        comments: 'No comments',
        status: isApproved && this.isNew ? 'To be processed' : 'Waiting for approval',
        referenceNumber: this.epo.referenceNumber,
        company: _.get(this, 'userLogged.company._id', ''),
        quoteCurrency: this.quoteCurrency,
        ipPatent,
      };
      return request;
    },
    validateSecondPatent() {
      const {
        requestedDeliveryDate,
        descriptionWordCount,
        claimWordCount,
      } = this.epo;
      return [
        requestedDeliveryDate,
        descriptionWordCount,
        claimWordCount,
      ]
        .every(el => el !== '' && el !== 0 && !_.isNil(el)) && this.isValidClaimsTranslation;
    },
    validateSecondPatentAndFiling() {
      const {
        requestedDeliveryDate,
        descriptionWordCount,
        descriptionPageCount,
        claimWordCount,
        claimsPageCount,
        numberOfClaims,
      } = this.epo;
      return [
        requestedDeliveryDate,
        descriptionWordCount,
        descriptionPageCount,
        claimWordCount,
        claimsPageCount,
        numberOfClaims,
      ]
        .every(el => el !== '' && el !== 0 && !_.isNil(el)) && this.isValidClaimsTranslation;
    },

    getLanguageCombinations(patentSrcLang) {
      const languageCombinations = [];
      this.translationFees.forEach(fee => {
        if (fee.englishTranslation || !fee.officialFilingLanguageIsoCode) return;
        const tgtLang = this.languages.find(l => l.isoCode === fee.officialFilingLanguageIsoCode);
        if (patentSrcLang._id === tgtLang._id) return;
        if (_.isEmpty(languageCombinations)) {
          languageCombinations.push({
            srcLangs: [patentSrcLang],
            tgtLangs: [tgtLang],
          });
          return;
        }
        if (languageCombinations[0].tgtLangs.some(tl => tl._id === tgtLang._id)) return;
        languageCombinations[0].tgtLangs.push(tgtLang);
      });
      if (!this.isNew) {
        const languageCombinationId = _.get(
          this.originalRequest,
          'languageCombinations.0._id',
          null
        );
        if (!_.isNil(languageCombinationId)) {
          languageCombinations[0]._id = languageCombinationId;
        }
        const documents = _.get(this.originalRequest, 'languageCombinations.0.documents', null);
        if (!_.isNil(documents)) {
          languageCombinations[0].documents = documents;
        }
      }
      return languageCombinations;
    },
  },
};
