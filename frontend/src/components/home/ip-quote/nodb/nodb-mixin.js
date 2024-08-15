
import _ from 'lodash';
import DropFiles from '../../../drop-files/drop-files.vue';
import NODBService from '../../../../services/nodb-service';
import RequestService from '../../../../services/request-service';
import RequestTypeService from '../../../../services/request-type-service';
import LanguageService from '../../../../services/language-service';
import ProgressSteps from '../../../progress-steps/index.vue';
import NodbNotCalculated from './nodb-not-calculated/nodb-not-calculated.vue';
import IpInput from '../components/ip-input.vue';
import IpDateInput from '../components/ip-date-input.vue';
import IpCountriesSelector from '../components/ip-countries-selector.vue';
import IpSelect from '../components/ip-select.vue';
import IpPopup from '../components/ip-popup.vue';
import IpChips from '../components/ip-chips.vue';
import IpModal from '../components/ip-modal.vue';
import IpButton from '../components/ip-button.vue/ip-button.vue';
import IpFileUpload from '../components/ip-file-upload/ip-file-upload.vue';
import IpUploadedFile from '../components/ip-file-upload/ip-uploaded-file.vue';
import IpRadioButton from '../components/ip-radio-button.vue';
import IpCard from '../components/ip-card.vue';

import SavedQuoteModal from '../modals/saved-quote/saved-quote.vue';
import SavedAndPdfModal from '../modals/saved-and-pdf-quote/saved-and-pdf-quote.vue';

import { stringDate } from '../../../../utils/handlebars/date';
import IpWizardStepSyncMixin from '../ip-wizard-step-sync-mixin';
import ContactService from '../../../../services/contact-service';
import quoteEditMixin from '../quote-edit-mixin';

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
  'specificationWordCount',
  'drawingsPageCount',
  'totalNumberOfPages',
];
const contactService = new ContactService();
const PCT_NATIONAL_PHASE = 'Direct Filing / Paris Convention';
const MAX_STEPS = 3;
const getQuoteSteps = isNew => [
  'Patent Details',
  'Select Countries',
  isNew ? 'Your Instant Quote' : 'Your Updated Instant Quote',
];
const SOURCE_LANG = [
  {
    name: 'English',
    isoCode: 'ENG',
  },
  {
    name: 'Japanese',
    isoCode: 'JPN',
  },
  {
    name: 'Chinese',
    isoCode: 'ZHO',
  },
  {
    name: 'German',
    isoCode: 'GER',
  },
  {
    name: 'Korean',
    isoCode: 'KOR',
  },
  {
    name: 'French',
    isoCode: 'FRE',
  },
  {
    name: 'Portuguese',
    isoCode: 'POR',
  },
  {
    name: 'Spanish',
    isoCode: 'SPA',
  },
  {
    name: 'Russian',
    isoCode: 'RUS',
  },
];

export default {
  mixins: [IpWizardStepSyncMixin, quoteEditMixin],
  components: {
    ProgressSteps,
    IpInput,
    IpDateInput,
    IpCountriesSelector,
    IpSelect,
    IpPopup,
    IpModal,
    IpChips,
    IpButton,
    DropFiles,
    SavedQuoteModal,
    SavedAndPdfModal,
    IpFileUpload,
    IpUploadedFile,
    IpRadioButton,
    NodbNotCalculated,
    IpCard,
  },
  data: () => ({
    loading: false,
    nodbService: null,
    requestService: null,
    requestTypeService: null,
    languageService: null,
    steps: [],
    currentStep: 0,
    maxSteps: [],
    requestType: null,
    languages: [],
    dictionaryLanguages: [],
    requestEntity: null,
    salesRep: '',
    salesRepEmail: '',
    service: [],
    database: [],
    originalRequest: null,
    originalCounts: {},
    countNames: [],
  }),
  props: {
    entityId: {
      type: String,
      default: '',
    },
  },
  created() {
    this.nodbService = new NODBService();
    this.requestService = new RequestService();
    this.requestTypeService = new RequestTypeService();
    this.languageService = new LanguageService();
    this.steps = getQuoteSteps(this.isNew);
    this.maxSteps = MAX_STEPS;
    this.languages = SOURCE_LANG;
    this.database = PCT_NATIONAL_PHASE;
    this.countNames = COUNT_NAMES;
  },
  async mounted() {
    this.service = _.get(this.$route, 'params.service', this.service);
    this.database = _.get(this.$route, 'params.database', this.database);
    this.init();
  },
  watch: {
    showQuoteModal(val) {
      if (!val && this.isSaved) {
        this.returnToIPQoute();
      }
    },

    showApproveModal(val) {
      if (!val) {
        this.returnToIPQoute();
      }
    },
  },
  methods: {
    async init() {
      this.stringDate = stringDate;
      this.requestedBy = `${_.get(this.userLogged, 'firstName')} ${_.get(
        this.userLogged,
        'lastName',
      )}`;
      this.setSalesRep();
      const {
        data: { list },
      } = await this.requestTypeService.retrieve({ filter: { name: 'IP' } });
      const ipRequestType = list.find(service => service.name === 'IP');
      if (ipRequestType) {
        this.requestType = ipRequestType;
      } else {
        this.pushNotification({
          title: 'Error',
          message: 'IP request type could not be retrieved',
          state: 'danger',
        });
      }

      this.getLanguagesDictionary();
      if (!this.isNew) {
        const response = await this.requestService.get(this.entityId);
        this.originalRequest = _.get(response, 'data.request', {});
        this.requestEntity = _.clone(this.originalRequest);
        this.populateFromOriginalRequest();
      }
    },
    async getLanguagesDictionary() {
      try {
        const {
          data: { list },
        } = await this.languageService.retrieve();
        this.dictionaryLanguages = list;
      } catch (error) {
        this.pushNotification({
          title: 'Error',
          message: 'IP Countries could not be retrieved',
          state: 'danger',
          response: error,
        });
      }
    },

    async getCurrencies() {
      this.loading = true;
      const { data } = await this.nodbService
        .listCurrencies({ database: 'No DB' })
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
    onQuoteDetailEnter() {
      this.redirectToQuoteDetailPage();
    },
    setSalesRep() {
      contactService.get(_.get(this.userLogged, '_id')).then((data) => {
        const salesRep = _.get(data, 'data.contact.contactDetails.salesRep');
        this.salesRep = `${salesRep.firstName} ${salesRep.lastName}`;
        this.salesRepEmail = _.defaultTo(salesRep.email, '');
      });
    },
    getTemplate(translationOnly) {
      return this.nodbService.retrieveTemplate(translationOnly);
    },
    isDanger(value) {
      return this.isRequired && value === null;
    },
    populateFromOriginalRequest() {
      const patent = _.get(this.originalRequest, 'ipPatent', {});
      const countries = _.get(
        patent,
        'countries',
        []
      );
      this.specificationWordCount = _.get(patent, 'specificationWordCount', '');
      this.drawingsWordCount = _.get(patent, 'drawingsWordCount', '');
      this.numberOfDrawings = _.get(patent, 'numberOfDrawings', '');
      this.drawingsPageCount = _.get(patent, 'drawingsPageCount', '');
      this.referenceNumber = _.get(this.originalRequest, 'referenceNumber', '');
      this.instantQuoteCountriesSelected = countries.filter(c => c.instantQuote)
        .map(country => ({ ...country, checked: true }));
      this.customQuoteCountriesSelected = countries.filter(c => !c.instantQuote)
        .map(country => ({ ...country, checked: true }));
      this.abstractWordCount = _.get(patent, 'abstractWordCount', '');
      this.descriptionWordCount = _.get(patent, 'descriptionWordCount', '');
      this.claimsWordCount = _.get(patent, 'claimsWordCount', '');
      this.numberOfDrawingPages = _.get(patent, 'numberOfDrawingPages', '');
      this.filingDate = _.get(patent, 'filingDate', '');
      this.priorityDate = _.get(patent, 'priorityDate', '');
      this.requestedDeliveryDate = _.get(this.originalRequest, 'deliveryDate', null);
      this.filingDeadline = _.get(patent, 'filingDeadline', '');
      this.applicantName = _.get(patent, 'applicantName', '');
      this.customUsersSelected = this.applicantName.split(', ');
      this.quoteLanguage = _.get(this.originalRequest, 'languageCombinations.0.srcLangs.0', null);
      this.numberOfClaims = _.get(patent, 'numberOfClaims', '');
      this.numberOfIndependentClaims = _.get(patent, 'numberOfIndependentClaims', '');
      this.numberOfPriorityApplications = _.get(patent, 'numberOfPriorityApplications', '');
      this.totalNumberOfPages = _.get(patent, 'totalNumberOfPages', '');
      this.claimPriority = _.get(patent, 'claimPriority', '');
      this.originalCounts = _.pick(this, COUNT_NAMES);
      this.files = _.get(this.originalRequest, 'languageCombinations.0.documents', []);
    },
  },
};
