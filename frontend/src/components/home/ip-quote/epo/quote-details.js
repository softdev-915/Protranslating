import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import IpCard from '../components/ip-card.vue';
import { stringDate } from '../../../../utils/handlebars/date';
import { formatNumber } from '../../../../utils/handlebars/helper';
import ContactService from '../../../../services/contact-service';

const contactService = new ContactService();
const STEP = {
  PATENT_AUTH: 0,
  PATENT_DETAILS: 1,
  SELECT_COUNTRIES: 2,
  INSTANT_QUOTE: 3,
};

export default {
  components: {
    IpCard,
  },
  props: {
    title: {
      type: String,
      required: true,
    },
    epo: {
      type: Object,
      default: {},
    },
    service: {
      type: String,
    },
    database: {
      type: String,
    },
    countriesSelected: {
      type: Array,
      default: () => [],
    },
    translationOnly: {
      type: Boolean,
      default: false,
    },
    isOrder: {
      type: Boolean,
      default: false,
    },
    isClaimsTranslationGrantedProvided: {
      type: Boolean,
      default: false,
    },
    claimsTranslationGranted: {
      type: Boolean,
      default: false,
    },
    step: {
      type: Number,
      default: 0,
    },
  },
  created() {
    this.formatDate = stringDate;
    this.formatNumber = formatNumber;
    this.requestedBy = `${_.get(this.userLogged, 'firstName')} ${_.get(
      this.userLogged,
      'lastName',
    )}`;
    this.salesRep = '';
    this.salesRepEmail = '';
    contactService.get(_.get(this.userLogged, '_id')).then((data) => {
      const salesRep = _.get(data, 'data.contact.contactDetails.salesRep');
      if (_.isNil(salesRep)) {
        this.pushNotification({
          title: 'Error',
          message: 'Failed to retrieve sales representative',
          state: 'danger',
          ttl: 3,
        });
        return;
      }
      this.salesRep = `${salesRep.firstName} ${salesRep.lastName}`;
      this.salesRepEmail = _.get(salesRep, 'email', '');
    });
  },
  watch: {
    salesRep: {
      handler(salesRep) {
        this.salesRepEmail = '';
        if (_.isObject(salesRep)) this.salesRepEmail = _.defaultTo(salesRep.email, '');
      },
      immediate: true,
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    isDetailsFilled() {
      const countsFilled = this.isOrder ? true
        : (!_.isNil(this.epo.descriptionWordCount)
          && !_.isNil(this.epo.claimWordCount)
      && !_.isNil(this.epo.drawingsPageCount));
      return !_.isEmpty(_.get(this, 'epo._id', '')) && !_.isNil(
        this.epo.requestedDeliveryDate,
      ) && countsFilled;
    },
    claimsTranslationGrantedText() {
      if (this.claimsTranslationGranted) {
        return 'Yes';
      }
      return 'No';
    },
    statutoryDeadlineDate() {
      const date = this.epo.statutoryDeadline;
      return !_.isNil(date) && !_.isEmpty(date) ? this.formatDate(date) : 'N/A';
    },
    claimsTranslationDeliveryDate() {
      if (this.epo.requestedDeliveryDateClaimsTranslation) {
        return this.formatDate(this.epo.requestedDeliveryDateClaimsTranslation);
      }
      return 'N/A';
    },
    otherLanguagesText() {
      return this.epo.otherLanguages.filter((l) => l.selected).map((l) => l.name).join(', ');
    },
    countryNames() {
      return this.countriesSelected.map((c) => c.name).join(', ');
    },
    isCountriesSelected() {
      return this.countriesSelected.length > 0;
    },
    isEPGrantedClaimsTranslation() {
      return this.step > STEP.PATENT_DETAILS;
    },
    isPatentDetails() {
      return this.step > STEP.PATENT_AUTH;
    },
    validationDeadline() {
      if (_.isNil(this.epo.validationDeadline)) {
        return 'N/A';
      }
      return this.formatDate(this.epo.validationDeadline);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    formatApplicants(applicants) {
      const listOfApplicants = applicants.split('|');

      if (listOfApplicants.length === 1) {
        return applicants;
      }
      return listOfApplicants.map((applicant, index) => `${index + 1}. ${applicant.trim()}`).join('<br>');
    },
  },
};
