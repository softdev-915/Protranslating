import _ from 'lodash';
import IpDateInput from '../components/ip-date-input.vue';
import IpInput from '../components/ip-input.vue';
import IpCardSection from '../components/ip-card-section.vue';

export default {
  components: {
    IpDateInput,
    IpInput,
    IpCardSection,
  },
  props: {
    value: {
      type: Object,
      default: () => {},
    },
    translationOnly: {
      type: Boolean,
      default: false,
    },
    isOrder: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      details: {
        requestedDeliveryDate: null,
        referenceNumber: '',
        descriptionWordCount: '',
        claimWordCount: '',
        drawingsPageCount: '',
        drawingsWordCount: '',
        claimsPageCount: '',
        numberOfClaims: '',
        descriptionPageCount: '',
        isAnnuityQuotationRequired: false,
      },
    };
  },
  created() {
    _.assign(this.details, _.defaultTo(this.value, {}));
  },
  computed: {
    isB1Available() {
      return this.value.kind === 'B1';
    },
    showAnnuityQuotationCheckbox() {
      return !this.isOrder && !this.translationOnly;
    },
  },
  watch: {
    details: {
      deep: true,
      handler() {
        this.$emit('input', this.details);
      },
    },
    value(newValue, oldValue) {
      if (!_.isEqual(newValue, oldValue)) {
        this.details = this.value;
      }
    },
  },
};
