import _ from 'lodash';
import Promise from 'bluebird';
import { mapGetters } from 'vuex';
import EpoMixin from '../ip-quote/epo/epo-mixin';
import IpQuoteHelperMixin from '../ip-quote/ip-quote-helper-mixin';
import OrderDetails from './order-details.vue';
import RequestService from '../../../services/request-service';
import { LANG_ISO_CODES_CONVERSION, extendLanguageCombinations } from '../ip-quote/helpers';

const requestService = new RequestService();
const STEPS = [
  'Patent Authentication',
  'Patent Details',
  'Select Countries',
  'Order Details',
];
export default {
  mixins: [EpoMixin, IpQuoteHelperMixin],
  components: {
    OrderDetails,
  },
  data() {
    return {
      isValidClaimsTranslation: true,
      requestNumber: '',
      isValidOrderDetails: true,
      claimsTranslationGranted: false,
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    isSecondStepFilled() {
      const isCountsValid = this.isOrder ? true : this.epo.descriptionWordCount !== ''
      && this.epo.claimWordCount !== ''
      && this.epo.drawingsWordCount !== ''
      && this.epo.drawingsPageCount !== '' && this.isValidClaimsTranslation;
      return this.epo.requestedDeliveryDate !== '' && isCountsValid;
    },
    trackingCombo() {
      return this.translationOnly ? 'C2' : 'C5';
    },
  },
  created() {
    this.orderDetails = {
      alsoDeliverTo: {
        _id: '', firstName: '', lastName: '', email: '',
      },
      otherCC: '',
      instructionsAndComments: '',
      files: [],
    };
    this.createdRequestId = '';
    this.service = this.translationOnly ? 'Patent Translation Order' : 'Patent Translation and Filing Order';
    this.database = this.translationOnly ? 'EP Validation/Claims in response to 71(3)' : 'EP Validation';
    this.title = 'Your Order Details';
    this.steps = STEPS;
  },
  methods: {
    prepareRequest() {
      const srcLang = _.defaultTo(this.epo.sourceLanguage, 'EN');
      const patentSrcLangName = LANG_ISO_CODES_CONVERSION[srcLang];
      const patentSrcLang = this.languages.find(
        (l) => l.isoCode === patentSrcLangName,
      );
      const languageCombinations = [];
      const requestCounties = [];
      this.translationFees.forEach((fee) => {
        requestCounties.push({
          name: fee.country,
          officialLanguage: fee.officialFilingLanguage,
          officialFilingLanguageIsoCode: fee.officialFilingLanguageIsoCode,
        });
        if (fee.englishTranslation || !fee.officialFilingLanguageIsoCode) return;
        const tgtLang = this.languages.find((l) => l.isoCode === fee.officialFilingLanguageIsoCode);
        if (
          patentSrcLang._id !== tgtLang._id
          && !languageCombinations.some((lc) => lc.tgtLangs[0]._id === tgtLang._id)
        ) {
          const languageCombinationIndex = languageCombinations.findIndex((lang) => lang.srcLangs.includes(patentSrcLang));
          if (languageCombinationIndex > -1) {
            languageCombinations[languageCombinationIndex].tgtLangs.push(tgtLang);
          } else {
            languageCombinations.push({
              srcLangs: [patentSrcLang],
              tgtLangs: [tgtLang],
            });
          }
        }
      });
      const {
        title, requestedDeliveryDate, referenceNumber, patentApplicationNumber,
        patentPublicationNumber, applicantName, drawingsWordCount, descriptionWordCount,
        claimWordCount, drawingsPageCount, otherLanguages, statutoryDeadline,
        requestedDeliveryDateClaimsTranslation, numberOfClaims, descriptionPageCount,
        validationDeadline,
      } = this.epo;
      extendLanguageCombinations({
        languages: this.languages, otherLanguages, languageCombinations, patentSrcLang,
      });
      const request = {
        requestType: this.requestType,
        title,
        requireQuotation: false,
        deliveryDate: requestedDeliveryDate,
        languageCombinations,
        comments: 'No comments',
        status: 'To be processed',
        referenceNumber,
        company: _.get(this, 'userLogged.company._id', ''),
        quoteCurrency: this.quoteCurrency,
        ipPatent: {
          service: this.service,
          database: this.database,
          patentApplicationNumber: patentApplicationNumber.toString(),
          patentPublicationNumber: patentPublicationNumber.toString(),
          sourceLanguage: patentSrcLang.name,
          applicantName,
          drawingsWordCount: _.isEmpty(drawingsWordCount) ? 0 : drawingsWordCount,
          descriptionWordCount,
          claimsWordCount: claimWordCount,
          drawingsPageCount,
          claimsTranslationGranted: this.claimsTranslationGranted,
          otherLanguages,
          countries: requestCounties,
          statutoryDeadline: this.formatDate(statutoryDeadline),
          requestedDeliveryDateClaimsTranslation:
            this.formatDate(requestedDeliveryDateClaimsTranslation),
          validationDeadline,
        },
      };
      if (!this.translationOnly) {
        request.ipPatent.numberOfClaims = numberOfClaims;
        request.ipPatent.descriptionPageCount = descriptionPageCount;
      }
      return request;
    },
    openDiscardOrderModal() {
      this.showDiscardQuoteModal = true;
      this.trackDiscardOrder(this.trackingCombo);
    },
    async saveOrder() {
      if (!this.isValidOrderDetails) return false;
      this.trackSubmitOrder(this.trackingCombo);
      this.loading = true;
      let requestCreated;
      try {
        const { data } = await this.createRequest();
        requestCreated = data.request;
      } catch (err) {
        this.pushNotification({
          title: 'Error',
          message: "Couldn't save a quote",
          state: 'danger',
          response: err,
        });
        this.loading = false;
        return;
      }
      if (requestCreated) {
        this.requestNumber = requestCreated.no;
        this.createdRequestId = requestCreated._id;
        const otherCC = [];
        if (!_.isEmpty(this.orderDetails.otherCC)) otherCC.push(this.orderDetails.otherCC);
        const requestUpdated = _.assign(
          requestService.getRequestUpdateRequiredFields(requestCreated), {
            otherContact: _.get(this, 'orderDetails.alsoDeliverTo._id'),
            comments: this.orderDetails.instructionsAndComments || 'No Comments',
            otherCC,
          },
        );
        try {
          await requestService.edit(requestUpdated);
          const fileUploadPromises = [];
          this.orderDetails.files.forEach((file) => {
            const formData = new FormData();
            formData.append('files', file);
            fileUploadPromises.push(requestService.uploadRequestDocument(formData, {
              requestId: this.createdRequestId,
              languageCombinationId: _.get(requestUpdated, 'languageCombinations[0]._id', null),
            }));
          });
          await Promise.map(fileUploadPromises, (file) => file, { concurrency: 3 });
          this.showSavedQuoteModal = true;
        } catch (error) {
          this.pushNotification({
            title: 'Error',
            message: "Couldn't save a quote",
            state: 'danger',
            response: error,
          });
          this.loading = false;
        } finally {
          this.loading = false;
        }
      }
    },
    onOrderDetailEnter() {
      this.$router.push({
        name: 'request-edition',
        params: { requestId: this.createdRequestId },
      }).catch((err) => { console.log(err); });
    },
    onClaimsTranslationValidation(isValidClaimsTranslation) {
      this.isValidClaimsTranslation = isValidClaimsTranslation;
    },
    onClaimsTranslationGranted(claimsTranslationGranted) {
      this.claimsTranslationGranted = claimsTranslationGranted;
    },
    onOrderDetailsUpdate(orderDetails) {
      this.orderDetails = orderDetails;
    },
    onOrderDetailsValidation(isValidOrderDetails) {
      this.isValidOrderDetails = isValidOrderDetails;
    },
  },
};
