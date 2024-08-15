/* eslint-disable arrow-parens */
import NodbMixin from '../../ip-quote/nodb/nodb-mixin.js';
import NodbOrderMixin from './nodb-order-mixin.js';
import IpQuoteHelperMixin from '../../ip-quote/ip-quote-helper-mixin';
import IpWizardTrackingMixin from '../../ip-quote/ip-wizard-tracking-mixin';

const TRANSLATION_ONLY_QUOTE = 'Patent Translation Order';

export default {
  name: 'IPOrderCreateNoDB',
  mixins: [NodbMixin, NodbOrderMixin, IpQuoteHelperMixin, IpWizardTrackingMixin],
  created() {
    this.isOrder = true;
  },
  data: () => ({
    service: TRANSLATION_ONLY_QUOTE,
    trackingCombo: 'C3',
  }),
  methods: {
    prepareRequest() {
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
      const formatDateTitle = this.stringDate(new Date(), 'YYMMDD');
      const title = `Direct Filing/Paris Conv_Translation Only_R-${formatDateTitle}`;
      const total = 0;
      const ipPatentCalculated = this.calculatedCountries.map((country) => ({
        officialLanguage: country.filingLanguage,
        name: country.country,
        sourceLanguage: this.quoteLanguage.name,
        instantQuote: true,
        translationFee: 0,
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
      return {
        requestType: this.requestType,
        requireQuotation: false,
        deliveryDate: this.requestedDeliveryDate,
        title: title,
        languageCombinations: languageCombinations,
        company: this.userLogged.company._id,
        comments: this.instructionsAndComments || 'No comments',
        status: 'To be processed',
        referenceNumber: this.referenceNumber,
        ipPatent: {
          service: this.service,
          database: 'Direct Filing/Paris Convention',
          applicantName: this.customUsersSelected.join(', '),
          filingDeadline: this.filingDeadline,
          countries: ipPatentCountries,
          total: total,
        },
      };
    },
    openDiscardOrderModal() {
      this.trackDiscardOrder(this.trackingCombo);
      this.showQuoteModal = true;
    },
    async saveOrder() {
      if (this.loading) return;
      if (!this.isValidOrderDetails) {
        this.isRequired = true;
        this.pushNotification({
          title: 'Warning',
          message: 'Please enter the required fields (marked as red)',
          state: 'warning',
        });
        return;
      }
      this.trackSubmitOrder(this.trackingCombo);
      this.loading = true;
      const request = this.prepareRequest();
      try {
        const { data } = await this.nodbService.createRequest(request, false);
        this.showApproveModal = true;
        const requestCreated = data.request;
        if (requestCreated) {
          this.requestCreated = requestCreated;
          await this.uploadAdditionalData(requestCreated);
          this.isSaved = true;
        }
      } catch (err) {
        this.pushNotification({
          title: 'Error',
          message: "Couldn't to save a order",
          state: 'danger',
          response: err,
        });
      }
    },
  },
};
