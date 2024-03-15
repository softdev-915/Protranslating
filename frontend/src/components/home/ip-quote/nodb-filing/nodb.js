/* eslint-disable no-undef */
/* eslint-disable arrow-parens */
import _ from 'lodash';
import moment from 'moment';
import { mapActions, mapGetters } from 'vuex';
import Handlebars from 'handlebars/dist/handlebars';
import NodbMixin from '../nodb/nodb-mixin.js';
import loadHelpers from '../../../../utils/handlebars';
import IpQuoteHelperMixin from '../ip-quote-helper-mixin.js';
import IpQuoteTrackingMixin from '../ip-wizard-tracking-mixin';
import IpPdfExportMixin from '../ip-pdf-export-mixin';
import IpQuoteCsvExporter from '../../../../utils/csv/ip-quote-exporter';

loadHelpers(Handlebars);

const TRANSLATION_ONLY_QUOTE = 'Patent Translation and Filing Quote';
const BASIC_DISCLAIMERS = [
  'The above estimate is subject to change. Should such a change arise, our team will contact you for approval in advance.',
  `The above estimate does not include fees that may be incurred for extensions, late filing of formal documents, maintenance fees,
  amendments, or sequence listings.`,
];
const DEFAULT_QUOTE_CURRENCY_CODE = 'USD';

export default {
  name: 'IPQuoteCreateNoDB',
  mixins: [NodbMixin, IpQuoteHelperMixin, IpQuoteTrackingMixin, IpPdfExportMixin],
  data: () => ({
    // quote step 1
    requestedDeliveryDate: null,
    quoteLanguage: null,
    filingDeadline: null,
    specificationWordCount: '',
    drawingsWordCount: '',
    numberOfDrawings: '',
    numberOfClaims: '',
    referenceNumber: '',
    numberOfIndependentClaims: '',
    totalNumberOfPages: '',
    claimPriority: false,
    customUsersSelected: [],
    files: [],
    filesApprove: [],
    // quote details step 2
    instantQuoteCountriesSelected: [],
    customQuoteCountriesSelected: [],
    // quote step 2
    abstractWordCount: '',
    descriptionWordCount: '',
    claimsWordCount: '',
    numberOfDrawingPages: '',
    // quote step 3
    calculatedCountries: [],
    instructionsAndComments: '',
    // right card
    service: TRANSLATION_ONLY_QUOTE,
    database: 'Direct Filing / Paris Convention',
    requestedBy: '',
    patentTitle: '',
    salesRepEmail: '',
    patentPublicationNumber: '',
    applicantName: '',
    thirtyMonthsDeadline: '',
    // quote step 4
    currencies: [],
    quoteCurrency: null,
    quoteDisclaimers: [],
    showQuoteModal: false,
    showApproveModal: false,
    // helpers data
    isRequired: false,
    isSaved: false,
    isPDF: false,
    isApproveQuote: false,
    quotePdfVisible: false,
    nodbTemplate: '',
    trackingCombo: 'C6',
    showTranslationFees: false,
    translationOnly: false,
  }),
  props: {
    entityId: {
      type: String,
      default: '',
    },
  },
  created() {
    this.isOrder = false;
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'lsp']),
    isFirstStepFilled() {
      return (
        !_.isNull(this.requestedDeliveryDate)
        && !_.isNull(this.quoteLanguage)
        && !_.isNull(this.filingDeadline)
        && this.specificationWordCount
        && this.drawingsWordCount
        && this.numberOfDrawings
        && this.customUsersSelected.length > 0
        && this.numberOfClaims
        && this.numberOfIndependentClaims
        && this.totalNumberOfPages
        && (!this.isNew || this.files.length > 0)
      );
    },
    isSecondStepFilled() {
      return this.instantQuoteCountriesSelected.length > 0
        || this.customQuoteCountriesSelected.length > 0;
    },
    isThirdStepFilled() {
      return !_.isEmpty(this.instantQuoteCountriesSelected);
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
    countryNames() {
      return this.selectedCountries.map(c => c.name);
    },
    isInstantSourceLanguage() {
      return _.get(this.quoteLanguage, 'name') === 'English';
    },
    canApproveQuote() {
      return _.isEmpty(this.customQuoteCountriesSelected);
    },
    isTranslationOnlyQuote() {
      return this.service === TRANSLATION_ONLY_QUOTE;
    },
    requestNumber() {
      return _.get(this.requestEntity, 'no', '');
    },
    showControlsBar() {
      return this.currentStep !== 2;
    },
    isNew() {
      return _.isEmpty(this.entityId);
    },
    showBackButton() {
      if (!this.isNew && this.currentStep < 1) {
        return false;
      }
      return true;
    },
  },

  methods: {
    ...mapActions('notifications', ['pushNotification']),

    async incrementStep() {
      if (this.loading) return;
      if (this.currentStep === 0) {
        if (this.isFirstStepFilled) {
          await this.getCurrencies();
          this.isRequired = false;
          this.currentStep += 1;
        } else {
          this.isRequired = true;
          this.pushNotification({
            title: 'Warning',
            message: 'Please enter the required fields (marked as red)',
            state: 'warning',
          });
        }
      } else if (this.currentStep === 1) {
        if (this.isSecondStepFilled) {
          await this.getCurrencies();
          await this.getTranslationFees();
          await this.saveQuote();
          this.currentStep += 1;
        } else {
          this.pushNotification({
            title: 'Warning',
            message: 'You should select at least one country',
            state: 'warning',
          });
        }
      } else if (this.currentStep === 2) {
        if (this.isThirdStepFilled) {
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
              'This quote cannot be approved as it is pending the customized quote for one or more countries selected. Please select Actions to save your quote.',
            state: 'warning',
          });
        }
      }
      await this.scrollToTop();
    },
    async getTranslationFees() {
      this.loading = true;
      const { data } = await this.nodbService
        .listInstantQuoteTranslationFeeFiling({
          countries: this.instantQuoteCountriesSelected.map((c) => c.name),
          entities: this.instantQuoteCountriesSelected.map(
            (c) => c.activeEntity || '',
          ),
          specificationWordCount: this.specificationWordCount,
          drawingsWordCount: this.drawingsWordCount,
          numberOfDrawings: this.numberOfDrawings,
          numberOfClaims: this.numberOfClaims,
          numberOfIndependentClaims: this.numberOfIndependentClaims,
          totalNumberOfPages: this.totalNumberOfPages,
          applicantsLength: this.customUsersSelected.length,
        })
        .catch((error) => this.pushNotification({
          title: 'Error',
          message: 'Instant quote translation fees could not be retrieved',
          state: 'danger',
          response: error,
        }))
        .finally(() => {
          this.loading = false;
        });
      this.calculatedCountries = data.list;
      const { defaultQuoteCurrencyCode = DEFAULT_QUOTE_CURRENCY_CODE } = data;
      this.quoteCurrency = this.currencies.find(c => c.isoCode === defaultQuoteCurrencyCode);
      this.quoteDisclaimers = [...BASIC_DISCLAIMERS, ...data.disclaimers];
    },

    async saveQuote(track = false) {
      if (this.loading) {
        return;
      }
      if (track) {
        this.trackSaveQuote(this.trackingCombo);
      }
      this.loading = true;

      try {
        const { data } = await this.createOrUpdateRequest();
        const requestEntity = data.request;
        if (this.isNew) {
          this.requestEntity = requestEntity;
          if (!this.isApproveQuote) {
            await this.uploadFiles();
          }
        }
        this.isSaved = true;
        if (this.showTranslationFees && !this.isApproveQuote) {
          this.showQuoteModal = true;
        }
      } catch (err) {
        this.pushNotification({
          title: 'Error',
          message: "Couldn't save a quote",
          state: 'danger',
          response: err,
        });
      }
      this.loading = false;
    },

    async updateRequest() {
      const preparedRequest = this.prepareRequestForSaving();
      return await this.nodbService.updateRequest(preparedRequest, false);
    },
    async createRequest() {
      const preparedRequest = this.prepareRequestForSaving();
      return await this.nodbService.createRequest(preparedRequest, false);
    },
    prepareRequestForSaving() {
      const patentSrcLang = this.dictionaryLanguages.find(
        (l) => l.isoCode === this.quoteLanguage.isoCode,
      );
      const tgtLangs = [];
      this.calculatedCountries.forEach((calculatedCountry) => {
        const tgtLang = this.dictionaryLanguages.find(
          (l) => l.isoCode === calculatedCountry.filingIsoCode,
        );
        if (
          patentSrcLang._id !== tgtLang._id
          && !tgtLangs.some((lc) => lc._id === tgtLang._id)
        ) {
          tgtLangs.push(tgtLang);
        }
      });
      const languageCombinations = [
        {
          srcLangs: [patentSrcLang],
          tgtLangs: tgtLangs,
        },
      ];
      if (!this.isNew) {
        const languageCombinationId = _.get(
          this.originalRequest,
          'languageCombinations.0._id',
          null,
        );
        if (!_.isNil(languageCombinationId)) {
          languageCombinations[0]._id = languageCombinationId;
        }
        const documents = _.get(this.originalRequest, 'languageCombinations.0.documents');
        languageCombinations[0].documents = documents;
      }
      const formatDateTitle = this.stringDate(new Date(), 'YYMMDD');
      const title = `Direct Filing/Paris Conv_Translation & Filing_R-${formatDateTitle}`;
      const quoteCurrencyCode = _.get(this.quoteCurrency, 'isoCode', null);
      const ipPatentCalculated = this.calculatedCountries.map((country) => ({
        officialLanguage: country.filingLanguage,
        name: country.country,
        sourceLanguage: this.quoteLanguage.name,
        instantQuote: true,
        agencyFee: country.agencyFee[quoteCurrencyCode],
        officialFee: country.officialFee[quoteCurrencyCode],
        translationFee: country.translationFeeCalculated[quoteCurrencyCode],
        total: this.totalPrice(country),
      }));
      const ipPatentNotCalculated = this.customQuoteCountriesSelected.map(
        (country) => ({
          officialLanguage: '',
          name: country.name,
          instantQuote: false,
          sourceLanguage: this.quoteLanguage.name,
          translationFee: 0,
          officialFee: 0,
          agencyFee: 0,
        }),
      );
      const ipPatentCountries = ipPatentCalculated.concat(
        ipPatentNotCalculated,
      );
      const request = {
        requestType: this.requestType,
        requireQuotation: true,
        deliveryDate: this.requestedDeliveryDate,
        title: title,
        languageCombinations: languageCombinations,
        company: this.userLogged.company._id,
        comments: this.instructionsAndComments || 'No comments',
        status: 'Waiting for Quote',
        referenceNumber: this.referenceNumber,
        quoteCurrency: this.quoteCurrency,
        ipPatent: {
          service: this.service,
          database: 'Direct Filing/Paris Convention',
          applicantName: this.formatUsers(this.customUsersSelected),
          filingDeadline: this.filingDeadline,
          specificationWordCount: parseInt(this.specificationWordCount, 10),
          drawingsWordCount: parseInt(this.drawingsWordCount, 10),
          numberOfDrawings: parseInt(this.numberOfDrawings, 10),
          numberOfClaims: parseInt(this.numberOfClaims, 10),
          numberOfIndependentClaims: parseInt(
            this.numberOfIndependentClaims,
            10,
          ),
          totalNumberOfPages: parseInt(this.totalNumberOfPages, 10),
          countries: ipPatentCountries,
          total: _.sumBy(ipPatentCountries, country => country.total),
          claimPriority: this.claimPriority,
          disclaimers: this.quoteDisclaimers,
        },
      };

      if (!this.isNew) {
        request._id = _.get(this.originalRequest, '_id', null);
      }
      return request;
    },
    onInstantCountriesUpdate(value) {
      this.instantQuoteCountriesSelected = value;
    },
    onCustomCountriesUpdate(value) {
      this.customQuoteCountriesSelected = value;
    },
    onCustomUsersUpdate(value) {
      this.customUsersSelected = value;
    },
    reset() {
      this.showQuoteModal = false;
      this.requestedDeliveryDate = null;
      this.quoteLanguage = null;
      this.filingDeadline = null;
      this.specificationWordCount = '';
      this.drawingsWordCount = '';
      this.numberOfDrawings = '';
      this.numberOfClaims = '';
      this.referenceNumber = '';
      this.totalNumberOfPages = '';
      this.numberOfIndependentClaims = '';
      this.customUsersSelected = [];
      this.files = [];
      this.instantQuoteCountriesSelected = [];
      this.customQuoteCountriesSelected = [];
      this.currentStep = 0;
      this.claimPriority = false;
      this.trackDeleteQuote(this.trackingCombo);
    },

    onUserSelected(users) {
      this.customUsersSelected = users;
    },

    formatDate(date) {
      if (!moment(date).isValid()) return '';
      return moment(date).format('YYYY-MM-DD').toString();
    },

    formatUsers(users) {
      return users.join(', ');
    },
    closeModal() {
      this.showQuoteModal = false;
      this.isSaved = false;
    },
    createExportFileName() {
      return `ParisConventionEstimate for ${this.requestNumber}`;
    },
    async exportPdf() {
      this.trackSaveAndExportQuote(this.trackingCombo);
      this.isPDF = true;
      await this.saveQuote();
      try {
        const {
          data: { template },
        } = await this.getTemplate(false);
        const compiledTemplate = Handlebars.compile(template.template);
        const {
          no, referenceNumber, comments, status, quoteCurrency,
        } = this.requestEntity;
        this.nodbTemplate = compiledTemplate(
          {
            ...this.requestEntity,
            lsp: this.lsp,
            disclaimers: this.quoteDisclaimers,
            request: {
              no,
              referenceNumber,
              comments,
              status,
            },
            templateLogo: _.get(template, 'variables.templateLogo', ''),
            requestCurrency: _.get(quoteCurrency, 'isoCode', ''),
            requestCurrencySymbol: _.get(quoteCurrency, 'symbol', ''),
          },
        );
        const pdfName = this.createExportFileName();
        await this.generatePdfReport(template.footerTemplate, pdfName, this.nodbTemplate);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    },
    async exportCsv() {
      await this.saveQuote(true, false);
      const csvName = this.createExportFileName();
      new IpQuoteCsvExporter(this.requestEntity).export(csvName);
    },
    returnToIPQoute() {
      this.$router.push({ name: 'ip-quote-dashboard' }).catch((err) => { console.log(err); });
    },

    async openQuoteModal() {
      if (!this.canApproveQuote || this.loading) {
        this.pushNotification({
          title: 'Warning',
          message:
            `This quote cannot be approved as it is pending the
            customized quote for one or more countries selected. Please select Actions to save your quote.`,
          state: 'warning',
        });
        return;
      }

      this.isApproveQuote = true;
      this.trackApproveQuote(this.trackingCombo);
      await this.saveQuote();
      this.showApproveModal = true;
    },

    async approveQuote() {
      this.trackSubmitQuote(this.trackingCombo);
      await this.saveQuote();
      this.onQuoteDetailEnter();
    },

    discardQuote() {
      this.trackDiscardQuote(this.trackingCombo);
      this.showQuoteModal = true;
    },

    onFilesUpload(files) {
      this.files = files;
    },

    onFilesUploadApprove(files) {
      this.filesApprove = files;
    },

    getFileInfo(file) {
      return {
        name: file.name,
        size: file.size,
        objectUrl: this.isNew ? URL.createObjectURL(file) : '',
        ext: file.name.split('.').pop(),
      };
    },

    async uploadFiles() {
      const fileUploadPromises = [];
      const allFiles = this.files.concat(this.filesApprove);
      _.forEach(allFiles, (file) => {
        const formData = new FormData();
        formData.append('files', file);
        fileUploadPromises.push(
          this.requestService.uploadRequestDocument(formData, {
            requestId: this.requestEntity._id,
            languageCombinationId:
              _.get(this.requestEntity, 'languageCombinations[0]._id', null),
          }),
        );
      });
      try {
        await Promise.all(fileUploadPromises);
      } catch (err) {
        this.pushNotification({
          title: 'Error',
          message: "Couldn't be able to save files",
          state: 'danger',
          response: err,
        });
      }
    },

    onClaimPriorityYesChanged(checked) {
      this.claimPriority = checked;
    },

    onClaimPriorityNoChanged(checked) {
      this.claimPriority = !checked;
    },

    totalPrice(country, formatValue = false) {
      const quoteCurrencyCode = _.get(this.quoteCurrency, 'isoCode', null);
      const translationFee = country.translationFeeCalculated[quoteCurrencyCode];
      const agencyFee = country.agencyFee[quoteCurrencyCode];
      const officialFee = country.officialFee[quoteCurrencyCode];
      const total = (parseFloat(translationFee) + parseFloat(agencyFee) + parseFloat(officialFee));
      return formatValue ? this.formatFee(total) : total;
    },
  },
};
