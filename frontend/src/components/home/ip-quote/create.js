/* eslint-disable arrow-parens */
import _ from 'lodash';
import moment from 'moment';
import Promise from 'bluebird';
import Handlebars from 'handlebars/dist/handlebars';
import { mapActions, mapGetters } from 'vuex';
import WIPOService from '../../../services/wipo-service';
import RequestService from '../../../services/request-service';
import RequestTypeService from '../../../services/request-type-service';
import LanguageService from '../../../services/language-service';
import loadHelpers from '../../../utils/handlebars';
import ProgressSteps from '../../progress-steps/index.vue';
import IPInput from './components/ip-input.vue';
import IPDateInput from './components/ip-date-input.vue';
import IpCountriesSelector from './components/ip-countries-selector.vue';
import IpSelect from './components/ip-select.vue';
import IpPopup from './components/ip-popup.vue';
import IpModal from './components/ip-modal.vue';
import IpButton from './components/ip-button.vue/ip-button.vue';
import IpFileUpload from './components/ip-file-upload/ip-file-upload.vue';
import NodbNotCalculated from './nodb/nodb-not-calculated/nodb-not-calculated.vue';
import OrderDetails from '../ip-order/order-details.vue';
import { stringDate } from '../../../utils/handlebars/date';
import IpQuoteHelperMixin from './ip-quote-helper-mixin';
import IpPdfExportMixin from './ip-pdf-export-mixin';
import IpCard from './components/ip-card.vue';
import IpWizardUrlStepSyncMixin from './ip-wizard-step-sync-mixin';
import IpQuoteTrackingMixin from './ip-wizard-tracking-mixin';
import ContactService from '../../../services/contact-service';
import { LANG_ISO_CODES_CONVERSION } from './helpers';
import IpQuoteCsvExporter from '../../../utils/csv/ip-quote-exporter';
import quoteEditMixin from './quote-edit-mixin';

const DATABASE_NAME = 'PCT National Phase';
const QUOTE_SERVICE_NAME = 'Patent Translation Quote';
const ORDER_SERVICE_NAME = 'Patent Translation Order';
const QUOTE_FILING_SERVICE_NAME = 'Patent Translation and Filing Quote';
const ORDER_FILING_SERVICE_NAME = 'Patent Translation and Filing Order';
const MAX_STEPS = 4;
const getQuoteSteps = (isNew) => [
  'Patent Authentication',
  'Patent Details',
  'Select Countries',
  isNew ? 'Your Instant Quote' : 'Your Updated Instant Quote',
];
const ORDER_STEPS = [
  'Patent Authentication',
  'Patent Details',
  'Select Countries',
  'Order Details',
];
const EUROPE = 'Europe';
const ISRAEL = 'Israel';
const EXCLUDE_AMERICA_DISCLAIMER_PARAMS = {
  code: 'US',
  entitySize: 'Small',
};
const STATUS_TO_BE_PROCESSED = 'To be processed';
const STATUS_WAITING_FOR_APPROVAL = 'Waiting for approval';
const STATUS_WAITING_FOR_QUOTE = 'Waiting for Quote';
const countryDirectIqFieldMap = {
  DE: 'deDirectIq',
  FR: 'frDirectIq',
};
const LATAM_COUNTRIES = 'LATAM';
const MIDDLE_EASTERN_COUNTRIES = 'Middle Eastern';
const RUSSIAN_COUNTRIES = 'Russian';
const ENGLISH_COUNTRIES = 'English';
const ENGLISH_SOURCE_LANGUAGE = 'EN';
const GERMAN_SOURCE_LANGUAGE = 'DE';
const FRENCH_SOURCE_LANGUAGE = 'FR';
const DEFAULT_QUOTE_CURRENCY_CODE = 'USD';
const COUNT_NAMES = [
  'abstractWordCount',
  'descriptionWordCount',
  'claimsWordCount',
  'drawingsWordCount',
  'numberOfDrawings',
  'numberOfDrawingPages',
  'numberOfTotalPages',
  'numberOfClaims',
  'numberOfPriorityApplications',
  'numberOfIndependentClaims',
];
const IP_INSTRUCTIONS_DEADLINE_RULE = 'IP-INSTRUCTIONS-DEADLINE > Notice based on Total or Claims Word Count';
loadHelpers(Handlebars);

const contactService = new ContactService();

export default {
  name: 'CreateIpQuote',
  mixins: [
    IpQuoteHelperMixin,
    IpWizardUrlStepSyncMixin,
    IpQuoteTrackingMixin,
    IpPdfExportMixin,
    quoteEditMixin,
  ],
  components: {
    ProgressSteps,
    'ip-input': IPInput,
    'ip-date-input': IPDateInput,
    'ip-countries-selector': IpCountriesSelector,
    'ip-select': IpSelect,
    'ip-popup': IpPopup,
    'ip-modal': IpModal,
    'ip-button': IpButton,
    'ip-file-upload': IpFileUpload,
    NodbNotCalculated,
    OrderDetails,
    IpCard,
  },
  props: {
    entityId: {
      type: String,
      default: '',
    },
  },
  data: () => ({
    loading: false,
    wipoService: new WIPOService(),
    requestService: new RequestService(),
    requestTypeService: new RequestTypeService(),
    languageService: new LanguageService(),
    steps: [],
    currentStep: 0,
    maxSteps: MAX_STEPS,
    isOrder: false,
    service: '',
    database: '',
    translationOnly: true,
    requestType: null,
    languages: [],
    requestEntity: null,
    patentNumber: '',
    wipo: null,
    requestedDeliveryDate: null,
    referenceNumber: '',
    abstractWordCount: '',
    descriptionWordCount: '',
    claimsWordCount: '',
    drawingsWordCount: '',
    numberOfDrawings: '',
    numberOfDrawingPages: '',
    numberOfTotalPages: '',
    numberOfClaims: '',
    numberOfPriorityApplications: '',
    numberOfIndependentClaims: '',
    isAnnuityQuotationRequired: false,
    wipoCountries: [],
    instantQuoteCountriesSelected: [],
    customQuoteCountriesSelected: [],
    annuityPaymentRow: {
      name: 'Annuity Payment',
      message: 'This will be sent to you in a separate email',
    },
    instantTranslationFees: [],
    customTranslationFees: [],
    ipInstructionDeadline: '',
    currencies: [],
    quoteCurrency: null,
    quoteDisclaimers: [],
    indirectTranslationDisclaimer: {},
    orderDetails: {},
    patentTitle: '',
    requestedBy: '',
    salesRep: '',
    salesRepEmail: '',
    patentPublicationNumber: '',
    applicantName: '',
    thirtyMonthsDeadline: '',
    instructionsAndComments: '',
    files: [],
    wipoTemplate: '',
    showApproveModal: false,
    showExportQuoteModal: false,
    showSavedQuoteModal: false,
    showDiscardQuoteModal: false,
    isValidOrderDetails: true,
    originalRequest: {},
    originalCounts: {},
  }),
  created() {
    this.formatDate = stringDate;
    this.isOrder = Boolean(
      _.get(this.$route, 'query.isOrder', false),
    );
    this.translationOnly = Boolean(
      _.get(this.$route, 'query.translationOnly', false),
    );
    this.steps = getQuoteSteps(this.isNew);
    if (this.isOrder) {
      this.steps = ORDER_STEPS;
    }
    this.countNames = COUNT_NAMES;
  },
  mounted() {
    this.init();
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'lsp']),
    isNew() {
      return _.isEmpty(this.entityId);
    },
    showBackButton() {
      if (!this.isNew && this.currentStep <= 1) {
        return false;
      }
      return true;
    },
    isNumberOfDrawingPagesEmpty() {
      return this.numberOfDrawingPages === '';
    },
    isFirstStepFilled() {
      return !!(
        this.patentNumber
        && this.patentTitle
        && this.requestedBy
        && this.applicantName
        && this.thirtyMonthsDeadline
      );
    },
    isSecondStepFilled() {
      if (this.isOrder) {
        return !_.isNil(this.requestedDeliveryDate);
      }
      if (this.isTranslationOnlyQuote) {
        return (
          !_.isNil(this.requestedDeliveryDate)
          && this.abstractWordCount !== ''
          && this.descriptionWordCount !== ''
          && this.claimsWordCount !== ''
          && this.abstractWordCount !== 0
          && this.descriptionWordCount !== 0
          && this.claimsWordCount !== 0
        );
      }
      return (
        !_.isNil(this.requestedDeliveryDate)
        && this.abstractWordCount !== ''
        && this.descriptionWordCount !== ''
        && this.claimsWordCount !== ''
        && this.numberOfTotalPages !== ''
        && this.numberOfClaims !== ''
        && this.numberOfPriorityApplications !== ''
        && this.abstractWordCount !== 0
        && this.descriptionWordCount !== 0
        && this.claimsWordCount !== 0
        && this.numberOfClaims !== 0
        && this.numberOfPriorityApplications !== 0
      );
    },
    translationFees() {
      return this.instantTranslationFees.concat(this.customTranslationFees);
    },
    isThirdStepFilled() {
      return this.instantQuoteCountriesSelected.length
        || this.customQuoteCountriesSelected.length;
    },
    isNewCountryAdded() {
      const originalCountryNames = _.get(this.originalRequest, 'ipPatent.countries', []).map(
        c => c.name,
      );
      return !_.isEmpty(_.difference(this.countryNames, originalCountryNames));
    },
    selectedCountries() {
      return this.instantQuoteCountriesSelected.concat(this.customQuoteCountriesSelected);
    },
    sourceLanguage() {
      return _.get(this.wipo, 'sourceLanguage', '');
    },
    sourceLanguageName() {
      const exceptionalLang = LANG_ISO_CODES_CONVERSION[this.sourceLanguage];
      if (exceptionalLang) {
        const language = this.languages.find(lang => lang.isoCode === exceptionalLang);
        return _.get(language, 'name', '');
      }
      const language = this.languages.find(lang => lang.isoCode === this.sourceLanguage);
      return _.get(language, 'name', '');
    },
    isInstantSourceLanguage() {
      const instantQuoteSrcLanguages = [
        ENGLISH_SOURCE_LANGUAGE, GERMAN_SOURCE_LANGUAGE, FRENCH_SOURCE_LANGUAGE,
      ];
      return instantQuoteSrcLanguages.includes(this.sourceLanguage);
    },
    showTranslationFees() {
      return this.isInstantSourceLanguage;
    },
    hideControls() {
      return this.currentStep === 3 && !this.showTranslationFees;
    },
    canApproveQuote() {
      return !this.translationFees.some(fee => fee.neededQuotation);
    },
    isTranslationOnlyQuote() {
      return this.translationOnly;
    },
    sholdDisplayCountryEntities() {
      return !this.isTranslationOnlyQuote;
    },
    requestNumber() {
      return _.get(this.requestEntity, 'no', '');
    },
    requestId() {
      return _.get(this.requestEntity, '_id', '');
    },
    wipoPCTReference() {
      return _.get(this.wipo, 'pctReference', '');
    },
    isNumberOfTotalPagesEmpty() {
      return !this.isTranslationOnlyQuote
        && _.isEqual(_.get(this.wipo, 'numberTotalPages', 0), 0);
    },
    isNumberOfDrawingsEmpty() {
      return this.isTranslationOnlyQuote
        && _.isEqual(_.get(this.wipo, 'numberOfDrawings', 0), 0);
    },
    trackingCombo() {
      return this.isTranslationOnlyQuote ? 'C1' : 'C4';
    },
    showAnnuityQuotationCheckbox() {
      return !this.isOrder && !this.isTranslationOnlyQuote;
    },
    showAnnuityPaymentRow() {
      return this.isAnnuityQuotationRequired && this.showAnnuityQuotationCheckbox;
    },
  },
  watch: {
    showSavedQuoteModal(newValue, oldValue) {
      if (!newValue && oldValue) {
        this.onCloseQuotePopup();
      }
    },
    showExportQuoteModal(newValue, oldValue) {
      if (!newValue && oldValue) {
        this.onCloseQuotePopup();
      }
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    async init() {
      this.database = DATABASE_NAME;
      if (this.isOrder) {
        this.service = this.translationOnly ? ORDER_SERVICE_NAME : ORDER_FILING_SERVICE_NAME;
      } else {
        this.service = this.translationOnly ? QUOTE_SERVICE_NAME : QUOTE_FILING_SERVICE_NAME;
      }
      const {
        data: { list },
      } = await this.requestTypeService.retrieve();
      const ipRequestType = list.find(requestType => requestType.name === 'IP');
      if (ipRequestType) {
        this.requestType = ipRequestType;
      } else {
        this.pushNotification({
          title: 'Error',
          message: 'IP request type could not be retrieved',
          state: 'danger',
        });
      }
      const { data } = await this.languageService.retrieve();
      this.languages = data.list;
      if (!this.isNew) {
        const response = await this.requestService.get(this.entityId);
        this.originalRequest = _.get(response, 'data.request', {});
        this.requestEntity = _.clone(this.originalRequest);
        await this.populateFromOriginalRequest();
        await this.getWipo();
        this.currentStep = 1;
      }
    },
    async incrementStep() {
      if (this.loading) return;
      if (this.currentStep === 0) {
        if (this.patentNumber) {
          await this.getWipo();
          await this.populateFromWipo();
          if (!_.isNil(this.wipo)) {
            this.currentStep += 1;
          }
        } else {
          this.pushNotification({
            title: 'Warning',
            message: 'Please fill the application number field',
            state: 'warning',
          });
        }
      } else if (this.currentStep === 1) {
        if (this.isSecondStepFilled) {
          this.fillEmptyFields();
          this.currentStep += 1;
        } else {
          this.pushNotification({
            title: 'Warning',
            message: 'You should fill all the required steps (marked as red)',
            state: 'warning',
          });
        }
      } else if (this.currentStep === 2) {
        if (this.isThirdStepFilled) {
          if (!this.isOrder) {
            await this.getCurrencies();
            await this.getDisclaimers();
            await this.getTranslationFees();
            if (!this.showTranslationFees) {
              await this.saveQuote({ showSavedQuoteModal: false });
            }
            this.currentStep += 1;
            await this.scrollToTop();
            return;
          }
          await this.getCurrencies();
          await this.getTranslationFees();
          this.currentStep += 1;
        } else {
          this.pushNotification({
            title: 'Warning',
            message: 'You should select at least one country',
            state: 'warning',
          });
        }
      } else if (this.currentStep === 3) {
        if (!this.customQuoteCountriesSelected.length) {
          this.currentStep += 1;
        } else {
          this.pushNotification({
            title: 'Warning',
            message:
              `This quote cannot be approved as it is pending the customized quote for one or more countries selected.
                Please select Actions to save your quote.`,
            state: 'warning',
          });
        }
      }
      await this.scrollToTop();
    },
    async getWipo() {
      if (!this.wipo) {
        this.loading = true;
        const preparedPatentNumber = this.patentNumber.trim();
        let payloadKey = '';
        if (preparedPatentNumber.includes('PCT')) {
          payloadKey = 'pctReference';
        } else if (preparedPatentNumber.includes('WO')) {
          payloadKey = 'patentPublicationNumber';
        } else {
          this.pushNotification({
            title: 'Error',
            message: 'Patent number not found',
            state: 'danger',
          });
          this.loading = false;
          return;
        }
        const {
          data: { wipo },
        } = await this.wipoService.get({ [payloadKey]: preparedPatentNumber })
          .catch(error => this.pushNotification({
            title: 'Error',
            message: 'WIPO entry could not be retrieved',
            state: 'danger',
            response: error,
          }))
          .finally(() => {
            this.loading = false;
          });
        if (_.isNil(wipo)) {
          this.pushNotification({
            title: 'Error',
            message: 'Patent number not found',
            state: 'danger',
          });
          return;
        }
        this.wipo = wipo;
      }
    },
    async getDisclaimers() {
      this.loading = true;
      const { data } = await this.wipoService
        .listDisclaimers()
        .catch(error => this.pushNotification({
          title: 'Error',
          message: 'IP Disclaimers could not be retrieved',
          state: 'danger',
          response: error,
        }))
        .finally(() => {
          this.loading = false;
        });
      const disclaimers = data.list;
      const commonDisclaimers = disclaimers.filter(d => d.country === 'ALL');
      if (this.isTranslationOnlyQuote) {
        this.quoteDisclaimers = commonDisclaimers.filter(
          d => d.translationOnly === true,
        );
      } else {
        this.quoteDisclaimers = commonDisclaimers;
      }
      this.indirectTranslationDisclaimer = disclaimers.find(d => d.country === 'Indirect Translation Countries');
      const allSelectedCountries = [
        ...this.instantQuoteCountriesSelected,
        ...this.customQuoteCountriesSelected,
      ];
      allSelectedCountries.forEach(c => {
        let countryDisclaimer = disclaimers.find(d => d.codes.includes(c.code));
        const isTranslationOnlyDisclaimer = _.get(
          countryDisclaimer,
          'translationOnly',
          false,
        );
        const excludeEnglishCountriesDisclaimer = this.sourceLanguage === ENGLISH_SOURCE_LANGUAGE && _.get(countryDisclaimer, 'country', '').includes('English countries');
        const excludeDisclaimer = (c.code === EXCLUDE_AMERICA_DISCLAIMER_PARAMS.code
            && c.activeEntity === EXCLUDE_AMERICA_DISCLAIMER_PARAMS.entitySize)
          || excludeEnglishCountriesDisclaimer;

        if ((this.isTranslationOnlyQuote && !isTranslationOnlyDisclaimer)
          || excludeDisclaimer) {
          countryDisclaimer = null;
        }
        if (countryDisclaimer) {
          const getCountryGroupsWithDisclaimers = (countryGroups) => countryGroups.filter(
            groupName => countryDisclaimer.country.includes(groupName),
          );
          const countryGroups = [
            LATAM_COUNTRIES, MIDDLE_EASTERN_COUNTRIES, RUSSIAN_COUNTRIES, ENGLISH_COUNTRIES,
          ];
          if (!_.isEmpty(getCountryGroupsWithDisclaimers(countryGroups))) {
            let disclaimerText = _.get(countryDisclaimer, 'disclaimer', '');
            const countries = allSelectedCountries.filter(country => countryDisclaimer.codes.includes(country.code));

            if (countries.length > 1) {
              disclaimerText = disclaimerText.replace(
                '{{selected_countries}}',
                countries.map(country => country.name).join(', '),
              );
              countryDisclaimer.disclaimer = disclaimerText;
            } else {
              return;
            }
          }

          if (countryDisclaimer.country === EUROPE && this.numberOfClaims <= 15) {
            return;
          }
          if (countryDisclaimer.country === ISRAEL && this.numberOfClaims <= 50) {
            return;
          }
          if (
            !this.quoteDisclaimers.find(d => d._id === countryDisclaimer._id)
          ) {
            this.quoteDisclaimers.push(countryDisclaimer);
          }
        }
      });
    },
    async getTranslationFees() {
      this.loading = true;
      const { data } = await this.wipoService
        .listInstantQuoteTranslationFee({
          wipoId: this.wipo._id,
          translationOnly: this.translationOnly,
          countries: this.instantQuoteCountriesSelected.map(c => c.name),
          descriptionWordCount: this.descriptionWordCount,
          claimsWordCount: this.claimsWordCount,
          drawingsWordCount: this.drawingsWordCount,
          abstractWordCount: this.abstractWordCount,
          drawingsPageCount: this.numberOfDrawingPages,
          numberOfTotalPages: this.numberOfTotalPages,
          numberOfClaims: this.numberOfClaims,
          numberOfIndependentClaims: this.numberOfIndependentClaims,
          numberOfPriorityApplications: this.numberOfPriorityApplications,
          numberOfDrawings: this.numberOfDrawings,
          entities: this.instantQuoteCountriesSelected.map(
            (c) => c.activeEntity || '',
          ),
        })
        .catch(error => this.pushNotification({
          title: 'Error',
          message: 'Instant quote translation fees could not be retrieved',
          state: 'danger',
          response: error,
        }))
        .finally(() => {
          this.loading = false;
        });
      this.instantTranslationFees = data.list.map(fee => ({ ...fee, neededQuotation: false }));
      this.ipInstructionDeadline = data.ipInstructionDeadline;
      let { defaultQuoteCurrencyCode = DEFAULT_QUOTE_CURRENCY_CODE } = data;
      if (!this.isNew) {
        defaultQuoteCurrencyCode = _.get(this.originalRequest, 'quoteCurrency.isoCode', defaultQuoteCurrencyCode);
      }
      this.quoteCurrency = this.currencies.find(c => c.isoCode === defaultQuoteCurrencyCode);
      this.quoteDisclaimers.forEach(disclaimer => {
        if (disclaimer.rule === IP_INSTRUCTIONS_DEADLINE_RULE) {
          disclaimer.disclaimer = disclaimer.disclaimer.replace('{{notice period}}', this.ipInstructionDeadline);
        }
      });
      if (this.sourceLanguage !== ENGLISH_SOURCE_LANGUAGE) {
        const directIqField = countryDirectIqFieldMap[this.sourceLanguage];
        const indirectTranslationCountries = this.instantQuoteCountriesSelected
          .filter(c => !c[directIqField]);
        const shouldShowIndirectTranslationDisclaimer = !_.isEmpty(indirectTranslationCountries)
          && !_.isNil(this.indirectTranslationDisclaimer);
        if (shouldShowIndirectTranslationDisclaimer) {
          this.quoteDisclaimers.push(this.indirectTranslationDisclaimer);
        }
      }
      this.customTranslationFees = this.getCustomTranslationFee();
    },
    async getCurrencies() {
      this.loading = true;
      const { data } = await this.wipoService
        .listCurrencies()
        .catch(error => this.pushNotification({
          title: 'Error',
          message: 'IP Currencies could not be retrieved',
          state: 'danger',
          response: error,
        }))
        .finally(() => {
          this.loading = false;
        });
      this.currencies = data.list;
    },
    getCustomTranslationFee() {
      const originalCustomCountries = _.get(this.originalRequest, 'ipPatent.countries', []).filter(
        c => !c.instantQuote,
      );
      return this.customQuoteCountriesSelected.map(country => {
        const previouslyAddedCC = originalCustomCountries
          .find(c => c.name === country.name);
        const total = !_.get(previouslyAddedCC, 'total', 0);
        if (!this.areCountsChanged && !this.isNew && !_.isNil(previouslyAddedCC) && total !== 0) {
          const curentIsoCode = this.quoteCurrency.isoCode;
          return {
            country: country.name,
            translationFeeCalculated: {
              [curentIsoCode]: previouslyAddedCC.translationFee,
            },
            agencyFeeCalculated: {
              [curentIsoCode]: previouslyAddedCC.agencyFee,
            },
            officialFeeCalculated: {
              [curentIsoCode]: previouslyAddedCC.officialFee,
            },
            neededQuotation: false,
          };
        }
        return {
          country: country.name,
          neededQuotation: true,
        };
      });
    },
    async populateFromWipo() {
      this.abstractWordCount = this.wipo.abstractWordCount;
      this.descriptionWordCount = this.wipo.descriptionWordCount;
      this.claimsWordCount = this.wipo.claimsWordCount;
      if (this.isTranslationOnlyQuote) {
        this.numberOfDrawings = _.get(this.wipo, 'numberOfDrawings', 0);
      } else {
        this.numberOfClaims = this.wipo.numberOfClaims;
        this.numberOfTotalPages = this.wipo.numberTotalPages;
        this.numberOfPriorityApplications = this.wipo.numberOfPriorityClaims;
      }
      this.numberOfDrawingPages = _.get(this.wipo, 'numberOfDrawingsPages', '');
      this.patentTitle = this.wipo.title;
      this.requestedBy = `${_.get(this.userLogged, 'firstName')} ${_.get(
        this.userLogged,
        'lastName',
      )}`;

      this.salesRep = '';
      this.salesRepEmail = '';
      contactService.get(_.get(this.userLogged, '_id')).then(data => {
        const salesRep = _.get(data, 'data.contact.contactDetails.salesRep');
        if (!_.isNil(salesRep)) {
          this.salesRep = `${salesRep.firstName} ${salesRep.lastName}`;
          this.salesRepEmail = _.defaultTo(salesRep.email, '');
        }
      });
      this.patentPublicationNumber = this.wipo.patentPublicationNumber;
      this.applicantName = this.wipo.applicantName;
      this.thirtyMonthsDeadline = this.wipo.thirtyMonthsDeadline;
    },
    prepareRequest(isApproved) {
      const srcLang = _.defaultTo(this.wipo.sourceLanguage, ENGLISH_SOURCE_LANGUAGE);
      const patentSrcLangName = LANG_ISO_CODES_CONVERSION[srcLang];
      const patentSrcLang = this.languages.find(
        l => l.isoCode === patentSrcLangName,
      );
      const languageCombinations = [];
      const orderCountries = [];
      this.instantTranslationFees.forEach(fee => {
        if (this.isOrder) {
          orderCountries.push({ name: fee.country, officialLanguage: fee.filingLanguage });
        }
        const tgtLang = this.languages.find(l => l.isoCode === fee.filingLanguageIso);
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
          null,
        );
        if (!_.isNil(languageCombinationId)) {
          languageCombinations[0]._id = languageCombinationId;
        }
        const documents = _.get(this.originalRequest, 'languageCombinations.0.documents', null);
        if (!_.isNil(documents)) {
          languageCombinations[0].documents = documents;
        }
      }
      const thirtyMonthsDeadline = moment(this.thirtyMonthsDeadline, '');
      let quoteCountries = [];
      let isQuoteRequired = false;
      if (!this.isOrder) {
        const requestIQCountries = this.instantTranslationFees.map(fee => {
          const iqCountryPayload = {
            name: fee.country,
            sourceLanguage: patentSrcLang.name,
            instantQuote: true,
            directTranslation: fee.directTranslation,
            officialLanguage: fee.filingLanguage,
            activeEntity: _.get(
              this.instantQuoteCountriesSelected.find(c => c.name === fee.country),
              'activeEntity',
            ),
            translationFee: fee.translationFeeCalculated[this.quoteCurrency.isoCode],
            total: this.calculateTotal(fee),
          };
          if (!this.isTranslationOnlyQuote) {
            iqCountryPayload.agencyFee = fee.agencyFeeCalculated[this.quoteCurrency.isoCode];
            iqCountryPayload.officialFee = fee.officialFeeCalculated[this.quoteCurrency.isoCode];
          }
          return iqCountryPayload;
        });
        const originalCustomCountries = _.get(this.originalRequest, 'ipPatent.countries', []).filter(
          c => !c.instantQuote,
        );
        const requestCCCountries = this.customQuoteCountriesSelected.map(country => {
          const defaultCC = {
            name: country.name,
            sourceLanguage: patentSrcLang.name,
            instantQuote: false,
            officialLanguage: '',
            agencyFee: 0,
            officialFee: 0,
            translationFee: 0,
            total: 0,
          };
          if (!this.isNew && !_.isEmpty(originalCustomCountries)) {
            const previouslyAddedCC = originalCustomCountries
              .find(c => c.name === country.name);
            return !_.isNil(previouslyAddedCC) ? _.clone(previouslyAddedCC) : defaultCC;
          }
          return defaultCC;
        });
        isQuoteRequired = requestCCCountries.some(c => c.total === 0);
        quoteCountries = [...requestIQCountries, ...requestCCCountries];
        if (this.isAnnuityQuotationRequired) {
          quoteCountries.push(_.pick(this.annuityPaymentRow, 'name'));
        }
      }
      let requestStatus = '';
      let isQuoteApproved = false;
      if (isApproved) {
        requestStatus = STATUS_TO_BE_PROCESSED;
        isQuoteApproved = true;
      } else if (
        !isQuoteRequired
        && ['ENG', 'GER', 'FRE'].includes(patentSrcLang.isoCode)
      ) {
        requestStatus = STATUS_WAITING_FOR_APPROVAL;
      } else {
        requestStatus = STATUS_WAITING_FOR_QUOTE;
      }
      const request = {
        requestType: this.requestType,
        title: this.patentTitle,
        requireQuotation: !this.isOrder,
        deliveryDate: this.requestedDeliveryDate,
        languageCombinations: languageCombinations,
        comments: 'No comments',
        status: requestStatus,
        isQuoteApproved,
        referenceNumber: this.referenceNumber,
        quoteCurrency: this.quoteCurrency,
        ipPatent: {
          service: this.service,
          database: this.database,
          title: this.wipo.title,
          patentApplicationNumber: this.wipo.pctReference,
          patentPublicationNumber: this.patentPublicationNumber,
          thirtyMonthsDeadline: thirtyMonthsDeadline.toISOString(),
          sourceLanguage: patentSrcLang.name,
          applicantName: this.applicantName,
          abstractWordCount: +this.abstractWordCount,
          drawingsWordCount: +this.drawingsWordCount,
          descriptionWordCount: +this.descriptionWordCount,
          numberOfDrawings: this.isTranslationOnlyQuote ? +this.numberOfDrawings : undefined,
          totalNumberOfPages: !this.isTranslationOnlyQuote ? +this.numberOfTotalPages : undefined,
          numberOfPriorityApplications:
            !this.isTranslationOnlyQuote ? +this.numberOfPriorityApplications : undefined,
          numberOfIndependentClaims:
            !this.isTranslationOnlyQuote ? +this.numberOfIndependentClaims : undefined,
          numberOfClaims: !this.isTranslationOnlyQuote ? +this.numberOfClaims : undefined,
          claimsWordCount: +this.claimsWordCount,
          drawingsPageCount: +this.numberOfDrawingPages,
          countries: !this.isOrder ? quoteCountries : orderCountries,
        },
      };
      if (!this.isOrder) {
        request.ipPatent.total = +this.totalFee;
        request.ipPatent.disclaimers = this.quoteDisclaimers.map(d => d.disclaimer);
      }
      if (!this.isOrder && !this.isTranslationOnlyQuote) {
        request.ipPatent.isAnnuityQuotationRequired = this.isAnnuityQuotationRequired;
      }
      return request;
    },
    createRequest(isApproved = false) {
      const request = this.prepareRequest(isApproved);
      return this.wipoService.createRequest(request, this.translationOnly);
    },
    createExportFileName() {
      const patentApplicationNumber = this.wipo.pctReference;
      return `PCTNationalPhaseEstimate for ${patentApplicationNumber}_${this.requestEntity.no}`;
    },
    async exportPdf() {
      if (!this.isOrder) this.trackSaveAndExportQuote(this.trackingCombo);
      await this.saveQuote({ showExportQuoteModal: true, showSavedQuoteModal: false });
      const { data } = await this.wipoService.retrieveTemplate(this.translationOnly);
      const compiledTemplate = Handlebars.compile(data.template.template);
      this.wipoTemplate = compiledTemplate(
        {
          ...this.requestEntity,
          lsp: this.lsp,
          disclaimers: this.quoteDisclaimers,
          requestCurrency: _.get(this.requestEntity, 'quoteCurrency.isoCode', ''),
          requestCurrencySymbol: _.get(this.requestEntity, 'quoteCurrency.symbol', ''),
          templateLogo: _.get(data, 'template.variables.templateLogo', ''),
          request: this.requestEntity,
        },
      );
      const pdfName = this.createExportFileName();
      await this.generatePdfReport(data.template.footerTemplate, pdfName, this.wipoTemplate);
    },
    async exportCsv() {
      await this.saveQuote({ showExportQuoteModal: true, showSavedQuoteModal: false });
      const csvName = this.createExportFileName();
      new IpQuoteCsvExporter(this.requestEntity).export(csvName);
    },
    async saveQuote({ showExportQuoteModal = false, showSavedQuoteModal = true, track = false }) {
      try {
        const { data } = await this.createOrUpdateRequest();
        const requestEntity = _.get(data, 'request', {});
        if (!_.isEmpty(requestEntity)) {
          this.requestEntity = requestEntity;
        }

        this.showExportQuoteModal = showExportQuoteModal;
        this.showSavedQuoteModal = showSavedQuoteModal;
        if (track && !this.isOrder) {
          this.trackSaveQuote(this.trackingCombo);
        }
        return;
      } catch (err) {
        this.pushNotification({
          title: 'Error',
          message: "Couldn't save a quote",
          state: 'danger',
          response: err,
        });
      }
    },
    async updateRequest(isApproved = false) {
      const request = this.prepareRequest(isApproved);
      request._id = this.originalRequest._id;
      return this.wipoService.updateRequest(request);
    },
    async saveOrder() {
      if (!this.isValidOrderDetails) return false;
      this.loading = true;
      if (this.isOrder) {
        this.trackSubmitOrder(this.trackingCombo);
      }
      const { data } = await this.createRequest(true).catch(err => this.pushNotification({
        title: 'Error',
        message: "Couldn't be able to save an order",
        state: 'danger',
        response: err,
      }));
      this.requestEntity = data.request;
      if (this.requestEntity) {
        const otherCC = [];
        if (!_.isEmpty(this.orderDetails.otherCC)) otherCC.push(this.orderDetails.otherCC);
        const requestUpdated = _.assign(this.requestService.getRequestUpdateRequiredFields(this.requestEntity), {
          otherContact: _.get(this, 'orderDetails.alsoDeliverTo._id'),
          comments: this.orderDetails.instructionsAndComments || 'No Comments',
          otherCC,
        });
        this.requestService.edit(requestUpdated)
          .then(() => {
            const fileUploadPromises = [];
            _.forEach(this.orderDetails.files, (file) => {
              const formData = new FormData();
              formData.append('files', file);
              fileUploadPromises.push(this.requestService.uploadRequestDocument(formData, {
                requestId: this.requestId,
                languageCombinationId: _.get(requestUpdated, 'languageCombinations[0]._id', null),
              }));
            });
            return Promise.all(fileUploadPromises).then(() => {
              this.showSavedQuoteModal = true;
            }).finally(() => { this.loading = false; });
          })
          .catch((err) => {
            this.pushNotification({
              title: 'Error',
              message: "Couldn't be able to save an order",
              state: 'danger',
              response: err,
            });
            this.loading = false;
          });
      }
    },
    async saveAndSeeQuote() {
      this.loading = true;
      this.trackSubmitQuote(this.trackingCombo);
      const commentsEmpty = _.isEmpty(this.instructionsAndComments);
      const requestUpdated = _.assign(this.requestService.getRequestUpdateRequiredFields(this.requestEntity), {
        comments: commentsEmpty ? 'No Comments' : this.instructionsAndComments,
        isQuoteApproved: true,
      });
      this.requestService.edit(requestUpdated)
        .then(() => {
          const requestData = {
            requestId: requestUpdated._id,
            languageCombinationId: _.get(requestUpdated, 'languageCombinations[0]._id', null),
          };
          const filesToUpload = this.files.map((file) => {
            const formData = new FormData();
            formData.append('files', file);
            return formData;
          });
          return Promise.map(
            filesToUpload,
            file => this.requestService.uploadRequestDocument(file, requestData),
            { concurrency: 3 },
          ).then(() => {
            this.redirectToQuoteDetailPage();
          });
        })
        .catch((err) => {
          this.pushNotification({
            title: 'Error',
            message: "Couldn't save a quote",
            state: 'danger',
            response: err,
          });
          this.loading = false;
        });
    },
    async approveQuote() {
      if (!this.canApproveQuote) {
        this.pushNotification({
          title: 'Error',
          message: "Couldn't approve a quote",
          state: 'danger',
        });
        return;
      }
      this.loading = true;
      const { data } = await this.createOrUpdateRequest(true).catch(err => this.pushNotification({
        title: 'Error',
        message: "Couldn't save a quote",
        state: 'danger',
        response: err,
      })).finally(() => { this.loading = false; });
      const requestEntity = data.request;
      if (requestEntity) {
        this.requestEntity = requestEntity;
      }
      this.trackApproveQuote(this.trackingCombo);
      this.showApproveModal = true;
    },
    openDiscardQuoteModal() {
      this.trackDiscardQuote(this.trackingCombo);
      this.showDiscardQuoteModal = true;
    },
    openDiscardOrderModal() {
      this.trackDiscardOrder(this.trackingCombo);
      this.showDiscardQuoteModal = true;
    },
    discardQuote() {
      if (!this.isNew) {
        return this.redirectToEditPage();
      }
      this.currentStep = 0;
      this.wipoCountries = [];
      this.instantQuoteCountriesSelected = [];
      this.customQuoteCountriesSelected = [];
      this.instantTranslationFees = [];
      this.quoteDisclaimers = [];
      this.currencies = [];
      this.patentNumber = '';
      this.showDiscardQuoteModal = false;
      if (this.isOrder) {
        this.trackDeleteOrder(this.trackingCombo);
      } else {
        this.trackDeleteQuote(this.trackingCombo);
      }
      this.reset();
    },
    onFilesUpload(files) {
      this.files = files;
    },
    onQuoteDetailEnter() {
      this.$router.push({
        name: this.isOrder ? 'request-edition' : 'quote-quote-detail',
        params: { requestId: this.requestEntity._id },
      });
    },
    onInstantCountriesUpdate(value) {
      this.instantQuoteCountriesSelected = value;
    },
    onCustomCountriesUpdate(value) {
      this.customQuoteCountriesSelected = value;
    },
    reset() {
      this.wipo = null;
      this.requestedDeliveryDate = null;
      this.abstractWordCount = '';
      this.descriptionWordCount = '';
      this.claimsWordCount = '';
      this.drawingsWordCount = '';
      this.numberOfDrawings = '';
      this.numberOfDrawingPages = '';
      this.numberOfTotalPages = '';
      this.numberOfPriorityApplications = '';
      this.numberOfIndependentClaims = '';
      this.numberOfClaims = '';
      this.patentTitle = '';
      this.requestedBy = '';
      this.salesRep = '';
      this.applicantName = '';
      this.thirtyMonthsDeadline = '';
    },
    populateFromOriginalRequest() {
      const ipPatent = _.get(this.originalRequest, 'ipPatent', {});
      this.requestedDeliveryDate = _.get(this.originalRequest, 'deliveryDate', null);
      this.abstractWordCount = _.get(ipPatent, 'abstractWordCount', '');
      this.descriptionWordCount = _.get(ipPatent, 'descriptionWordCount', '');
      this.claimsWordCount = _.get(ipPatent, 'claimsWordCount', '');
      this.drawingsWordCount = _.get(ipPatent, 'drawingsWordCount', '');
      this.referenceNumber = _.get(this.originalRequest, 'referenceNumber', '');
      this.numberOfDrawings = _.get(ipPatent, 'numberOfDrawings', '');
      this.numberOfDrawingPages = _.get(ipPatent, 'drawingsPageCount', '');
      this.numberOfTotalPages = _.get(ipPatent, 'totalNumberOfPages', '');
      this.numberOfPriorityApplications = _.get(ipPatent, 'numberOfPriorityApplications', '');
      this.numberOfIndependentClaims = _.get(ipPatent, 'numberOfIndependentClaims', '');
      this.numberOfClaims = _.get(ipPatent, 'numberOfClaims', '');
      this.patentTitle = _.get(ipPatent, 'title', '');
      this.requestedBy = `${_.get(this.userLogged, 'firstName')} ${_.get(this.userLogged, 'lastName')}`;
      this.applicantName = _.get(ipPatent, 'applicantName', '');
      this.thirtyMonthsDeadline = _.get(ipPatent, 'thirtyMonthsDeadline', '');
      this.patentNumber = _.get(ipPatent, 'patentApplicationNumber', '');
      const countries = _.get(ipPatent, 'countries', []);
      this.patentApplicationNumber = _.get(ipPatent, 'patentApplicationNumber', '');
      this.patentPublicationNumber = _.get(ipPatent, 'patentPublicationNumber', '');
      this.instantQuoteCountriesSelected = countries.filter(c => c.instantQuote).map(c => {
        c.checked = true;
        return c;
      });
      this.quoteDisclaimers = _.get(ipPatent, 'disclaimers', []);
      this.customQuoteCountriesSelected = countries.filter(c => !c.instantQuote).map(c => {
        c.checked = true;
        return c;
      });
      this.originalCounts = _.pick(this, COUNT_NAMES);
      this.isAnnuityQuotationRequired = _.get(ipPatent, 'isAnnuityQuotationRequired', false);
      this.fillEmptyFields();
      this.salesRep = '';
      this.salesRepEmail = '';
      const salesRep = _.get(this.originalRequest, 'salesRep', null);
      if (!_.isNil(salesRep)) {
        this.salesRep = `${salesRep.firstName} ${salesRep.lastName}`;
        this.salesRepEmail = _.defaultTo(salesRep.email, '');
      }
    },
    formatFee(fee) {
      const value = (+fee).toFixed(2);
      return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    formatNumber(number) {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    onCloseQuotePopup() {
      this.$router.push({
        name: 'quote-list',
      }).catch((err) => { console.log(err); });
    },
    onOrderDetailsUpdate(orderDetails) {
      this.orderDetails = orderDetails;
    },
    onOrderDetailsValidation(isValidOrderDetails) {
      this.isValidOrderDetails = isValidOrderDetails;
    },
    fillEmptyFields() {
      this.drawingsWordCount = +this.drawingsWordCount;
      this.numberOfDrawingPages = +this.numberOfDrawingPages;
      this.numberOfIndependentClaims = +this.numberOfIndependentClaims;
      this.numberOfTotalPages = +this.numberOfTotalPages;
    },
  },
};
