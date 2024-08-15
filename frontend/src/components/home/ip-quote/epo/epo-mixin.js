import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import Handlebars from 'handlebars/dist/handlebars';
import { stringDate } from '../../../../utils/handlebars/date';
import ProgressSteps from '../../../progress-steps/index.vue';
import PatentAuthentication from './patent-authentication.vue';
import PatentDetails from './patent-details.vue';
import InstantQuote from './instant-quote.vue';
import IpEpoCountriesSelector from '../components/ip-epo-countries-selector.vue';
import loadHelpers from '../../../../utils/handlebars';
import IpPopup from '../components/ip-popup.vue';
import IpModal from '../components/ip-modal.vue';
import RequestTypeService from '../../../../services/request-type-service';
import LanguageService from '../../../../services/language-service';
import EPOService from '../../../../services/epo-service';
import IpFileUpload from '../components/ip-file-upload/ip-file-upload.vue';
import IpInput from '../components/ip-input.vue';
import IpButton from '../components/ip-button.vue/ip-button.vue';
import QuoteDetails from './quote-details.vue';
import SavedAndPdfQuote from '../modals/saved-and-pdf-quote/saved-and-pdf-quote.vue';
import SavedQuote from '../modals/saved-quote/saved-quote.vue';
import DiscardQuote from '../modals/discard-quote/discard-quote.vue';
import ApproveQuote from '../modals/approve-quote/approve-quote.vue';
import IpWizardStepSyncMixin from '../ip-wizard-step-sync-mixin';
import IpWizardTrackingMixin from '../ip-wizard-tracking-mixin';
import GrantedClaimsTranslation from './granted-claims-translation.vue';
import IpPdfExportMixin from '../ip-pdf-export-mixin';
import IpQuoteCsvExporter from '../../../../utils/csv/ip-quote-exporter';
import RequestService from '../../../../services/request-service';
import quoteEditMixin from '../quote-edit-mixin';

const DEFAULT_QUOTE_CURRENCY_CODE = 'EUR';
const IP_INSTRUCTIONS_DEADLINE_RULE = 'IP-INSTRUCTIONS-DEADLINE > Notice based on Total or Claims Word Count';
const ORDER_ROUTE_NAME = 'ip-order-epo-create';
loadHelpers(Handlebars);
const defaultEpo = () => ({
  _id: '',
  sourceLanguage: '',
  patentPublicationNumber: '',
  patentPublicationDate: '',
  patentApplicationNumber: '',
  kind: '',
  descriptionWordCount: '',
  numberOfClaims: '',
  claimWordCount: '',
  title: '',
  validationDeadline: '',
  communicationOfIntentionDate: '',
  descriptionPageCount: '',
  claimsPageCount: '',
  drawingsPageCount: '',
  applicantName: '',
  requestedDeliveryDateClaimsTranslation: '',
  statutoryDeadline: '',
  claimsTranslationGranted: false,
  otherLanguages: [],
});
const getQuoteSteps = (isNew) => [
  'Patent Authentication',
  'Patent Details',
  'Select Countries',
  isNew ? 'Your Instant Quote' : 'Your Updated Instant Quote',
];
const DATABASE_NAME = 'EP Validation/Claims in response to 71(3)';
const TRANSLATION_ONLY_QUOTE = 'Patent Translation Quote';
const requestTypeService = new RequestTypeService();
const epoService = new EPOService();
const languageService = new LanguageService();
const requestService = new RequestService();

export default {
  mixins: [IpWizardStepSyncMixin, IpWizardTrackingMixin, IpPdfExportMixin, quoteEditMixin],
  components: {
    ProgressSteps,
    IpPopup,
    IpModal,
    PatentAuthentication,
    PatentDetails,
    IpEpoCountriesSelector,
    InstantQuote,
    IpFileUpload,
    IpInput,
    IpButton,
    QuoteDetails,
    SavedAndPdfQuote,
    SavedQuote,
    DiscardQuote,
    ApproveQuote,
    GrantedClaimsTranslation,
  },
  data() {
    return {
      loading: false,
      currentStep: 0,
      patentNumber: '',
      countriesSelected: [],
      translationFees: [],
      disclaimers: [],
      languages: [],
      instructionsAndComments: '',
      showApproveModal: false,
      showExportQuoteModal: false,
      showDiscardQuoteModal: false,
      showSavedQuoteModal: false,
      requestEntity: null,
      quoteCurrency: null,
      currencies: [],
      epoTemplate: '',
      totalFee: 0,
      epo: defaultEpo(),
      claimsTranslationFees: [],
      ipInstructionsDeadline: '',
      claimsTranslationFeesTotal: 0,
      originalRequest: null,
    };
  },
  props: {
    entityId: {
      type: String,
      default: '',
    },
  },
  created() {
    this.steps = getQuoteSteps(this.isNew);
    this.maxSteps = this.steps.length;
    this.formatDate = stringDate;
    this.service = _.get(this.$route, 'params.service', TRANSLATION_ONLY_QUOTE);
    this.database = _.get(this.$route, 'params.database', DATABASE_NAME);
    this.init();
    this.isOrder = this.$route.name === ORDER_ROUTE_NAME;
    const { translationOnly } = this.$route.query;
    this.translationOnly = Boolean(translationOnly) && translationOnly !== 'false';
  },
  computed: {
    ...mapGetters('app', ['lsp']),
    isLastStep() {
      return this.currentStep === this.maxSteps - 1;
    },
    isPatentAuthenticationStep() {
      return this.currentStep === 0;
    },
    isPatentDetailsStep() {
      return this.currentStep === 1;
    },
    isCountriesStep() {
      return this.currentStep === 2;
    },
    isInstantQuoteStep() {
      return this.currentStep === 3;
    },
    isThirdStepFilled() {
      const countryFilledCorrect = !_.isEmpty(this.countriesSelected) && !this.claimsTranslationGranted;
      return (countryFilledCorrect
        || this.isClaimsGrantedCountries);
    },
    isClaimsGrantedCountries() {
      return this.claimsTranslationGranted
        && this.isValidClaimsTranslation
        && !_.isEmpty(this.epo.otherLanguages);
    },
    epoOtherLanguageSelected() {
      return this.epo.otherLanguages.some((language) => language.selected === true);
    },
    isNew() {
      return _.isEmpty(this.entityId);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    async init() {
      try {
        const {
          data: { list },
        } = await requestTypeService.retrieve();
        const ipRequestType = list.find((requestType) => requestType.name === 'IP');
        if (!ipRequestType) {
          throw new Error('Failed to retrieve IP request type');
        }
        this.requestType = ipRequestType;
      } catch (err) {
        const message = _.get(err, 'message', 'IP request type could not be retrieved');
        this.pushNotification({
          title: 'Error',
          message,
          state: 'danger',
        });
      }
      const { data } = await languageService.retrieve();
      this.languages = data.list;
      if (!this.isNew) {
        const response = await requestService.get(this.entityId);
        this.originalRequest = _.get(response, 'data.request', {});
        this.requestEntity = _.clone(this.originalRequest);
        this.patentNumber = _.get(this.originalRequest, 'ipPatent.patentPublicationNumber', '');
        await this.getEpo();
        await this.populateFromOriginalRequest();
        this.currentStep = 1;
      }
    },

    populateFromOriginalRequest() {
      const patent = _.get(this.originalRequest, 'ipPatent', {});
      Object.assign(this.epo, {
        descriptionWordCount: _.get(patent, 'descriptionWordCount', 0),
        numberOfClaims: _.get(patent, 'numberOfClaims', 0),
        claimWordCount: _.get(patent, 'claimsWordCount', 0),
        isAnnuityQuotationRequired: _.get(patent, 'isAnnuityQuotationRequired', false),
        drawingsWordCount: _.get(patent, 'drawingsWordCount', ''),
        drawingsPageCount: _.get(patent, 'drawingsPageCount', 0),
        descriptionPageCount: _.get(patent, 'descriptionPageCount', 0),
        claimsPageCount: _.get(patent, 'claimsPageCount', 0),
        applicantCount: _.get(patent, 'applicantCount', 0),
        requestedDeliveryDate: _.get(this.originalRequest, 'deliveryDate', ''),
        claimsTranslationGranted: _.get(patent, 'claimsTranslationGranted', false),
        otherLanguages: _.get(patent, 'otherLanguages', []).map((language) => ({
          ...language, selected: true,
        })),
        requestedDeliveryDateClaimsTranslation: _.get(patent, 'requestedDeliveryDateClaimsTranslation', ''),
        referenceNumber: _.get(this.originalRequest, 'referenceNumber', ''),
        kind: _.get(patent, 'kind', ''),
        validationDeadline: _.get(patent, 'validationDeadline', ''),
      });
      this.countriesSelected = _.get(patent, 'countries', []).map((country) => ({
        ...country, checked: true,
      }));
      this.claimsTranslationGranted = _.get(patent, 'claimsTranslationGranted', false);
    },
    async getEpo() {
      this.loading = true;
      try {
        const { data: { epo } } = await epoService.get(this.patentNumber.trim());
        this.epo = epo;
      } catch (error) {
        this.epo = defaultEpo();
        const message = _.get(error, 'status.message', '');
        this.pushNotification({
          title: 'Error',
          message: message,
          state: 'danger',
          response: error,
        });
      } finally {
        this.loading = false;
      }
    },
    async incrementStep() {
      if (this.loading) return;
      if (this.currentStep === 0) {
        if (this.patentNumber) {
          await this.getEpo();
          if (!_.isEmpty(_.get(this.epo, '_id', ''))) {
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
          this.currentStep += 1;
        } else {
          this.pushNotification({
            title: 'Warning',
            message: 'You should fill all the required fields (marked as red)',
            state: 'warning',
          });
        }
      } else if (this.currentStep === 2) {
        if (this.isThirdStepFilled) {
          await this.getCurrencies();
          this.currentStep += 1;
          await this.getClaimsTranslationFees();
          await this.getTranslationFees();
          await this.getDisclaimers();
        } else {
          this.pushNotification({
            title: 'Warning',
            message: this.generateThirdStepError(),
            state: 'warning',
          });
        }
      }
      await this.scrollToTop();
    },
    openDiscardQuoteModal() {
      this.showDiscardQuoteModal = true;
      if (this.isOrder) {
        this.trackDiscardOrder(this.trackingCombo);
      } else {
        this.trackDiscardQuote(this.trackingCombo);
      }
    },
    onCountriesUpdate(value) {
      this.countriesSelected = value;
    },
    async getCurrencies() {
      this.loading = true;
      const { data } = await epoService
        .listCurrencies()
        .catch((error) => this.pushNotification({
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
    setQuoteCurrency(quoteResponseData) {
      let { defaultQuoteCurrencyCode = DEFAULT_QUOTE_CURRENCY_CODE } = quoteResponseData;
      if (!this.isNew) {
        defaultQuoteCurrencyCode = _.get(this.originalRequest, 'quoteCurrency.isoCode', defaultQuoteCurrencyCode);
      }
      this.quoteCurrency = this.currencies.find((c) => c.isoCode === defaultQuoteCurrencyCode);
    },
    async getTranslationFees() {
      if (_.isEmpty(this.countriesSelected)) {
        return;
      }
      this.loading = true;
      const { data } = await epoService
        .listTranslationFee({
          epoId: this.epo._id,
          countries: this.countriesSelected.map((c) => c.name),
          descriptionWordCount: this.epo.descriptionWordCount,
          claimWordCount: this.epo.claimWordCount,
          drawingsWordCount: this.epo.drawingsWordCount,
          drawingsPageCount: this.epo.drawingsPageCount,
          claimsPageCount: this.epo.claimsPageCount,
          descriptionPageCount: this.epo.descriptionPageCount,
          numberOfClaims: this.epo.numberOfClaims,
          applicantCount: this.epo.applicantCount,
          translationOnly: this.translationOnly,
          hasClaimsTranslationOccurred: this.isClaimsGrantedCountries,
          claimsTranslationFeesTotal: this.claimsTranslationFeesTotal,
        })
        .catch((error) => this.pushNotification({
          title: 'Error',
          message: 'Translation fees could not be retrieved',
          state: 'danger',
          response: error,
        }))
        .finally(() => {
          this.loading = false;
        });
      this.translationFees = data.list;
      this.setQuoteCurrency(data);
      this.ipInstructionsDeadline = data.ipInstructionsDeadline;
    },
    async getClaimsTranslationFees() {
      const otherLanguages = _.get(this.epo, 'otherLanguages', [])
        .filter((l) => l.selected)
        .map((l) => l.isoCode);
      if (_.isEmpty(otherLanguages)) {
        this.claimsTranslationFees = [];
        return;
      }
      this.loading = true;
      const { data } = await epoService.listClaimsTranslationFees({
        epoId: this.epo._id,
        claimsWordCount: this.epo.claimWordCount,
        otherLanguages,
      }).catch((error) => this.pushNotification({
        title: 'Error',
        message: 'Claims translation fees could not be retrieved',
        state: 'danger',
        response: error,
      })).finally(() => {
        this.loading = false;
      });
      this.claimsTranslationFees = data.list;
      this.setQuoteCurrency(data);
      this.ipInstructionsDeadline = data.ipInstructionsDeadline;
      this.claimsTranslationFeesTotal = this.getTranslationFeesTotal(this.claimsTranslationFees);
    },
    async getDisclaimers() {
      const { data: disclaimers } = await epoService
        .listDisclaimers({
          countries: this.countriesSelected.map((c) => c.name), translationOnly: this.translationOnly,
        })
        .catch((error) => this.pushNotification({
          title: 'Error',
          message: 'Disclaimers could not be retrieved',
          state: 'danger',
          response: error,
        }));
      this.disclaimers = disclaimers.list;
      this.disclaimers.forEach((disclaimer) => {
        if (disclaimer.rule === IP_INSTRUCTIONS_DEADLINE_RULE) {
          disclaimer.disclaimer = disclaimer.disclaimer.replace('{{notice period}}', this.ipInstructionsDeadline);
        }
      });
    },
    getTranslationFeesTotal(fees) {
      const quoteCurrencyCode = _.get(this.quoteCurrency, 'isoCode');
      return fees
        .reduce(
          (acc, { calculatedFee }) => acc + calculatedFee[quoteCurrencyCode],
          0,
        );
    },
    onPatentDetailsUpdate(details) {
      this.epo = _.assign({}, this.epo, details);
    },
    onGrantedClaimsUpdate(grantedClaims) {
      this.epo = _.assign({}, this.epo, grantedClaims);
    },
    createExportFileName() {
      const { patentPublicationNumber } = this.epo;
      return `EPValidationPhaseEstimate for ${patentPublicationNumber}_${this.requestEntity.no}`;
    },
    async exportPdf() {
      if (!this.isOrder) this.trackSaveAndExportQuote(this.trackingCombo);
      await this.saveQuote(true, false);
      const { data } = await epoService.retrieveTemplate(this.translationOnly);
      const compiledTemplate = Handlebars.compile(data.template.template);
      this.epoTemplate = compiledTemplate(
        {
          ...this.requestEntity,
          lsp: this.lsp,
          disclaimers: this.disclaimers,
          requestCurrency: _.get(this.requestEntity, 'quoteCurrency.isoCode', ''),
          requestCurrencySymbol: _.get(this.requestEntity, 'quoteCurrency.symbol', ''),
          templateLogo: _.get(data, 'template.variables.templateLogo', ''),
          request: this.requestEntity,
        },
      );
      const pdfName = this.createExportFileName();
      await this.generatePdfReport(data.template.footerTemplate, pdfName, this.epoTemplate);
    },
    async exportCsv() {
      await this.saveQuote(true, false);
      const csvName = this.createExportFileName();
      new IpQuoteCsvExporter(this.requestEntity).export(csvName);
    },
    async approveQuote() {
      this.loading = true;
      const { data } = await this.createOrUpdateRequest(true).catch((err) => this.pushNotification({
        title: 'Error',
        message: "Couldn't save a quote",
        state: 'danger',
        response: err,
      })).finally(() => { this.loading = false; });
      const requestEntity = data.request;
      if (requestEntity) {
        this.requestEntity = requestEntity;
      }
      this.showApproveModal = true;
      if (!this.isOrder) this.trackApproveQuote(this.trackingCombo);
    },
    async saveQuote(showExportModal, track = false) {
      try {
        const { data } = await this.createOrUpdateRequest();
        const requestEntity = data.request;
        if (requestEntity) {
          this.requestEntity = requestEntity;
        }
        if (showExportModal === true) {
          this.showExportQuoteModal = true;
        } else {
          this.showSavedQuoteModal = true;
        }
        if (track && !this.isOrder) {
          this.trackSaveQuote(this.trackingCombo);
        }
      } catch (e) {
        this.pushNotification({
          title: 'Error',
          message: "Couldn't save a quote",
          state: 'danger',
          response: e,
        });
      }
    },
    createRequest(isApproved = false) {
      const request = this.prepareRequest(isApproved);
      return epoService.createRequest(request, this.translationOnly);
    },
    updateRequest(isApproved = false) {
      const request = this.prepareRequest(isApproved);
      request._id = this.originalRequest._id;
      return epoService.updateRequest(request, this.translationOnly);
    },
    formatFee(fee) {
      const value = (+fee).toFixed(2);
      return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    reset() {
      this.epo = null;
      this.requestedBy = '';
      this.salesRep = '';
      this.applicantName = '';
    },
    discardQuote() {
      if (!this.isNew) {
        return this.redirectToEditPage();
      }
      this.currentStep = 0;
      this.epoCountries = [];
      this.countriesSelected = [];
      this.translationFees = [];
      this.disclaimers = [];
      this.currencies = [];
      this.claimsTranslationGranted = false;
      this.otherLanguages = [];
      this.statutoryDeadline = '';
      this.requestedDeliveryDateClaimsTranslation = '';
      this.showDiscardQuoteModal = false;
      this.reset();
      if (this.isOrder) {
        this.trackDeleteOrder();
      } else {
        this.trackDeleteQuote(this.trackingCombo);
      }
    },
    async onQuoteDetailEnter() {
      await this.redirectToEditPage();
    },
    onCloseQuotePopup() {
      this.$router.push({
        name: 'quote-list',
      });
    },
    onTotalFeeCalculation(totalFee) {
      this.totalFee = totalFee;
    },
    onCurrencySelect(currencySelected) {
      this.quoteCurrency = currencySelected;
    },
    generateThirdStepError() {
      if (this.claimsTranslationGranted) {
        return this.epoOtherLanguageSelected
          ? 'You should fill all the required fields (marked as red)' : 'You should select at least one official language';
      }
      return 'You should select at least one country';
    },
  },
};
