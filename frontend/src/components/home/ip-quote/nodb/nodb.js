/* eslint-disable no-undef */
/* eslint-disable arrow-parens */
import _ from 'lodash';
import Handlebars from 'handlebars/dist/handlebars';
import { mapActions, mapGetters } from 'vuex';
import NodbMixin from './nodb-mixin.js';
import loadHelpers from '../../../../utils/handlebars';
import IpQuoteHelperMixin from '../ip-quote-helper-mixin.js';
import IpQuoteTrackingMixin from '../ip-wizard-tracking-mixin';
import IpPdfExportMixin from '../ip-pdf-export-mixin';
import IpQuoteCsvExporter from '../../../../utils/csv/ip-quote-exporter';

loadHelpers(Handlebars);

const TRANSLATION_ONLY_QUOTE = 'Patent Translation Quote';
const BASIC_DISCLAIMERS = [
  'The above estimate is subject to change. Should such a change arise, our team will contact you for approval in advance.',
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
    drawingsPageCount: '',
    referenceNumber: '',
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
    ipInstructionDeadline: '',
    instructionsAndComments: '',
    // right card
    service: TRANSLATION_ONLY_QUOTE,
    database: '',
    requestedBy: '',
    patentTitle: '',
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
    trackingCombo: 'C3',
    originalRequest: null,
    customTranslationFees: [],
    instantTranslationFees: [],
    translationOnly: true,
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
    isNew() {
      return _.isEmpty(this.entityId);
    },
    isFirstStepFilled() {
      return (
        !_.isNull(this.requestedDeliveryDate)
        && !_.isNull(this.quoteLanguage)
        && !_.isNull(this.filingDeadline)
        && this.specificationWordCount
        && this.drawingsWordCount
        && this.numberOfDrawings
        && this.drawingsPageCount
        && this.customUsersSelected.length > 0
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
    translationFees() {
      return this.instantTranslationFees.concat(this.customTranslationFees);
    },
    isInstantSourceLanguage() {
      return _.get(this.quoteLanguage, 'name') === 'English';
    },
    showTranslationFees() {
      return this.isInstantSourceLanguage;
    },
    canApproveQuote() {
      return this.translationFees.filter(fee => fee.neededQuotation).length === 0;
    },
    isTranslationOnlyQuote() {
      return this.service === TRANSLATION_ONLY_QUOTE;
    },
    requestNumber() {
      return _.get(this.requestEntity, 'no', '');
    },
    showControlsBar() {
      return this.showTranslationFees || this.currentStep !== 2;
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

          if (this.showTranslationFees) {
            await this.getTranslationFees();
          } else {
            await this.getTranslationFees();
            await this.saveQuote();
          }
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
            message: 'This quote cannot be approved as it is pending the customized quote for one or more countries selected. Please select Actions to save your quote.',
            state: 'warning',
          });
        }
      }
      await this.scrollToTop();
    },
    async getTranslationFees() {
      this.loading = true;
      const { data } = await this.nodbService
        .listInstantQuoteTranslationFee({
          countries: this.instantQuoteCountriesSelected.map((c) => c.name),
          specificationWordCount: this.specificationWordCount,
          drawingsWordCount: this.drawingsWordCount,
          numberOfDrawings: this.numberOfDrawings,
          drawingsPageCount: this.drawingsPageCount,
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
      this.instantTranslationFees = _.get(data, 'list', []).map(c => ({ ...c, neededQuotation: false }));
      this.ipInstructionDeadline = data.ipInstructionDeadline;
      let { defaultQuoteCurrencyCode = DEFAULT_QUOTE_CURRENCY_CODE } = data;
      if (!this.isNew) {
        defaultQuoteCurrencyCode = _.get(this.originalRequest, 'quoteCurrency.isoCode', defaultQuoteCurrencyCode);
      }
      this.quoteCurrency = this.currencies.find(c => c.isoCode === defaultQuoteCurrencyCode);
      const disclaimers = data.disclaimers.map((disclaimer) => {
        if (disclaimer.includes('{{notice period}}')) {
          return disclaimer.replace('{{notice period}}', this.ipInstructionDeadline);
        }
        return disclaimer;
      });
      const originalCustomCountries = _.get(this.originalRequest, 'ipPatent.countries', []).filter(
        c => !c.instantQuote,
      );
      this.customTranslationFees = this.customQuoteCountriesSelected.map(country => {
        const previouslyAddedCC = originalCustomCountries
          .find(c => c.name === country.name);
        if (!this.areCountsChanged && !this.isNew && !_.isNil(previouslyAddedCC)) {
          const curentIsoCode = this.quoteCurrency.isoCode;
          return {
            country: country.name,
            translationFeeCalculated: {
              [curentIsoCode]: _.get(previouslyAddedCC, 'translationFee', 0),
            },
            neededQuotation: false,
          };
        }
        return {
          country: country.name,
          neededQuotation: true,
        };
      });
      this.quoteDisclaimers = [...BASIC_DISCLAIMERS, ...disclaimers];
    },
    async updateRequest() {
      const preparedRequest = this.prepareRequestForSaving();
      return await this.nodbService.updateRequest(preparedRequest, true);
    },
    async createRequest() {
      const preparedRequest = this.prepareRequestForSaving();
      return await this.nodbService.createRequest(preparedRequest, true);
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

    prepareRequestForSaving() {
      const languageCombinations = this.prepareLanguageCombinations();
      let status = '';
      if (this.isApproveQuote) {
        status = 'To be processed';
      } else if (
        this.customQuoteCountriesSelected.length === 0
        && this.showTranslationFees
      ) {
        status = 'Waiting for approval';
      } else {
        status = 'Waiting for Quote';
      }
      const formatDateTitle = this.stringDate(new Date(), 'YYMMDD');
      const title = `Direct Filing/Paris Conv_Translation Only_R-${formatDateTitle}`;
      const ipPatentCalculated = this.instantTranslationFees.map((country) => ({
        officialLanguage: country.filingLanguage,
        name: country.country,
        sourceLanguage: this.quoteLanguage.name,
        instantQuote: true,
        translationFee: country.translationFeeCalculated[this.quoteCurrency.isoCode],
      }));
      const ipPatentNotCalculated = this.customQuoteCountriesSelected.map(
        (country) => ({
          officialLanguage: '',
          name: country.name,
          instantQuote: false,
          sourceLanguage: this.quoteLanguage.name,
          translationFee: 0,
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
        status: status,
        isQuoteApproved: this.isApproveQuote,
        referenceNumber: this.referenceNumber,
        quoteCurrency: this.quoteCurrency,
        ipPatent: {
          service: this.service,
          database: 'Direct Filing/Paris Convention',
          applicantName: this.customUsersSelected.join(', '),
          filingDeadline: this.filingDeadline,
          specificationWordCount: parseInt(this.specificationWordCount, 10),
          drawingsWordCount: parseInt(this.drawingsWordCount, 10),
          numberOfDrawings: parseInt(this.numberOfDrawings, 10),
          drawingsPageCount: parseInt(this.drawingsPageCount, 10),
          countries: ipPatentCountries,
          total: Number(this.totalFee),
          disclaimers: this.quoteDisclaimers,
        },
      };
      if (!this.isNew) {
        request._id = _.get(this.originalRequest, '_id', null);
      }
      return request;
    },

    prepareLanguageCombinations() {
      const patentSrcLang = this.dictionaryLanguages.find(
        (l) => l.isoCode === this.quoteLanguage.isoCode,
      );
      const tgtLangs = [];
      this.instantTranslationFees.forEach((calculatedCountry) => {
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
      return languageCombinations;
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
    discardQuote() {
      if (this.isNew) {
        this.reset();
      }
    },
    reset() {
      this.showQuoteModal = false;
      this.requestedDeliveryDate = null;
      this.quoteLanguage = null;
      this.filingDeadline = null;
      this.specificationWordCount = '';
      this.drawingsWordCount = '';
      this.numberOfDrawings = '';
      this.drawingsPageCount = '';
      this.referenceNumber = '';
      this.customUsersSelected = [];
      this.files = [];
      this.instantQuoteCountriesSelected = [];
      this.customQuoteCountriesSelected = [];
      this.currentStep = 0;
      this.trackDeleteQuote(this.trackingCombo);
    },
    calculateFeeTotal(fee) {
      const { isoCode } = this.quoteCurrency;
      return Number(fee.translationFeeCalculated[isoCode]);
    },

    onUserSelected(users) {
      this.customUsersSelected = users;
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
        } = await this.getTemplate(true);
        const {
          no,
          referenceNumber,
          comments,
          status,
          quoteCurrency: { isoCode = '', symbol = '' } = {},
        } = this.requestEntity;
        const compiledTemplate = Handlebars.compile(template.template);
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
            requestCurrency: isoCode,
            requestCurrencySymbol: symbol,
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

    async approveQuote() {
      if (!this.canApproveQuote || this.loading) {
        this.pushNotification({
          title: 'Warning',
          message:
            `This quote cannot be approved as it is pending the customized quote for one or more countries selected.
            Please select Actions to save your quote.`,
          state: 'warning',
        });
        return;
      }

      this.isApproveQuote = true;
      await this.saveQuote();
      this.trackApproveQuote(this.trackingCombo);
      this.showApproveModal = true;
    },
    async saveAndSeeQuote() {
      this.trackSubmitQuote(this.trackingCombo);
      if (this.requestEntity) {
        const requestUpdated = _.assign(
          this.requestService.getRequestUpdateRequiredFields(this.requestEntity),
          {
            comments: this.instructionsAndComments || 'No comments',
            isQuoteApproved: true,
          },
        );
        requestUpdated._id = this.requestEntity._id;
        this.requestService.edit(requestUpdated)
          .then(() => {
            this.uploadFiles()
              .then(() => {
                this.onQuoteDetailEnter();
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
      }
    },
    openDiscardModal() {
      this.showQuoteModal = true;
      this.trackDiscardQuote(this.trackingCombo);
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
      if (!(this.files[0] instanceof File)) {
        return;
      }
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
  },
};
