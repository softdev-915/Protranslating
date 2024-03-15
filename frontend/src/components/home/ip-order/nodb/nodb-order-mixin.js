/* eslint-disable arrow-parens */
import _ from 'lodash';
import Promise from 'bluebird';
import { mapActions, mapGetters } from 'vuex';
import OrderDetails from '../nodb-order-details.vue';
import IpWizardStepSyncMixin from '../../ip-quote/ip-wizard-step-sync-mixin';
import IpWizardTrackingMixin from '../../ip-quote/ip-wizard-tracking-mixin';

const BASIC_DISCLAIMERS = [
  'The above estimate is subject to change. Should such a change arise, our team will contact you for approval in advance.',
];
const STEPS = ['Patent Details', 'Select Countries', 'Order details'];
const DEFAULT_QUOTE_CURRENCY_CODE = 'USD';

export default {
  components: {
    OrderDetails,
  },
  mixins: [IpWizardStepSyncMixin, IpWizardTrackingMixin],
  computed: {
    ...mapGetters('app', ['userLogged', 'lsp']),
    isFirstStepFilled() {
      return (
        !_.isNull(this.requestedDeliveryDate)
        && !_.isNull(this.quoteLanguage)
        && !_.isNull(this.filingDeadline)
        && this.customUsersSelected.length > 0
      );
    },
    isSecondStepFilled() {
      return (
        this.instantQuoteCountriesSelected.length
        || this.customQuoteCountriesSelected.length
      );
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
    countryNamesStr() {
      return this.countryNames.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())).join(', ');
    },
    totalFee() {
      return _.reduce(
        this.calculatedCountries,
        (sum, current) => sum + parseFloat(current.price),
        0,
      ).toFixed(2);
    },
    showTranslationFees() {
      return _.get(this.quoteLanguage, 'name') === 'English';
    },
    canApproveQuote() {
      return !this.customQuoteCountriesSelected.length;
    },
    showControlsBar() {
      return !(!this.showTranslationFees && this.currentStep === 2);
    },
  },
  data: () => ({
    steps: STEPS,
    // quote step 1
    requestedDeliveryDate: null,
    quoteLanguage: {
      isoCode: 'ENG',
      name: 'English',
    },
    filingDeadline: null,
    specificationWordCount: '0',
    drawingsWordCount: '0',
    numberOfDrawings: '0',
    numberOfClaims: '0',
    referenceNumber: '',
    numberOfIndependentClaims: '0',
    totalNumberOfPages: '0',
    customUsersSelected: [],
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
    // right card
    requestedBy: '',
    salesRep: '',
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
    orderDetails: {},
    isValidOrderDetails: true,
    requestNumber: '',
  }),
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
      this.calculatedCountries = data.list;
      const { defaultQuoteCurrencyCode = DEFAULT_QUOTE_CURRENCY_CODE } = data;
      this.quoteCurrency = this.currencies.find(c => c.isoCode === defaultQuoteCurrencyCode);
      this.quoteDisclaimers = [...BASIC_DISCLAIMERS, ...data.disclaimers];
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
      this.orderDetails = {};
      this.trackDeleteOrder(this.trackingCombo);
    },
    isInstantQuoteCountry(fee) {
      const countryName = fee.country;
      const isInstantQuoteCountry = !!this.instantQuoteCountriesSelected.find(
        (country) => country.name === countryName,
      );
      return isInstantQuoteCountry;
    },

    onUserSelected(users) {
      this.customUsersSelected = users;
    },

    closeModal() {
      this.showQuoteModal = false;
      this.isSaved = false;
    },

    navigateToIpOrderDashboard() {
      this.$router.push({ name: 'ip-order-dashboard' }).catch((err) => { console.log(err); });
    },

    async openQuoteModal() {
      if (!this.canApproveQuote || this.loading) {
        this.pushNotification({
          title: 'Warning',
          message:
            `This quote cannot be approved as it is pending the customized quote for one or
            more countries selected. Please select Actions to save your quote.`,
          state: 'warning',
        });
        return;
      }

      this.isApproveQuote = true;
      await this.saveOrder();
    },

    async approveQuote() {
      await this.saveOrder();
      this.onQuoteDetailEnter();
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

    async uploadAdditionalData(requestCreated) {
      this.requestNumber = requestCreated.no;
      this.createdRequestId = requestCreated._id;
      const otherCC = [];
      if (!_.isEmpty(this.orderDetails.otherCC)) {
        otherCC.push(this.orderDetails.otherCC);
      }
      const requestUpdated = _.assign(
        this.requestService.getRequestUpdateRequiredFields(requestCreated),
        {
          otherContact: _.get(this, 'orderDetails.alsoDeliverTo._id'),
          comments: this.orderDetails.instructionsAndComments || 'No comments',
          otherCC,
        },
      );
      this.requestService
        .edit(requestUpdated)
        .then(() => {
          const fileUploadPromises = [];
          _.forEach(this.orderDetails.files, (file) => {
            const formData = new FormData();
            formData.append('files', file);
            fileUploadPromises.push(
              this.requestService.uploadRequestDocument(formData, {
                requestId: this.createdRequestId,
                languageCombinationId:
                  _.get(requestUpdated, 'languageCombinations[0]._id', null),
              }),
            );
          });
          return Promise.map(fileUploadPromises, (file) => file, { concurrency: 3 })
            .then(() => {
              this.showQuoteModal = true;
            })
            .finally(() => {
              this.loading = false;
            });
        })
        .catch((err) => {
          this.pushNotification({
            title: 'Error',
            message: "Couldn't be able to save a order",
            state: 'danger',
            response: err,
          });
          this.loading = false;
        });
    },
    onOrderDetailsUpdate(orderDetails) {
      this.orderDetails = orderDetails;
    },
    onOrderDetailsValidation(isValidOrderDetails) {
      if (isValidOrderDetails) {
        this.isRequired = false;
      }

      this.isValidOrderDetails = isValidOrderDetails;
    },
  },
};
