import _ from 'lodash';
import { CountryStateMixin } from '../../../mixins/country-state-mixin';

export default {
  mixins: [CountryStateMixin],
  props: {
    value: {
      type: Object,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    required: {
      type: Boolean,
      default: false,
    },
    addressType: {
      type: String,
      default: '',
    },
    defaultCountryName: {
      type: String,
      default: 'United States',
    },
  },

  data() {
    return {
      addressInfo: {
        line1: '',
        line2: '',
        city: '',
        zip: '',
        country: {
          name: '',
          _id: '',
          code: '',
        },
        state: {
          name: '',
          _id: '',
        },
      },
    };
  },

  watch: {
    addressInfo: {
      handler(newValue) {
        this.$emit('input', newValue);
      },
      deep: true,
    },
    value: {
      handler(newValue) {
        if (!_.isEqual(this.addressInfo, newValue)) {
          _.assign(this.addressInfo, newValue);
        }
      },
      deep: true,
      immediate: true,
    },
  },

  methods: {
    setState(value) {
      this.addressInfo.state = value;
    },

    setCountry(value) {
      this.addressInfo.country = value;
    },
  },
  computed: {
    country() {
      const country = _.get(this, 'addressInfo.country');
      const countryId = _.get(country, '_id', country);
      const countryFound = this.countries.find((s) => s._id === countryId);
      return countryFound;
    },
    state() {
      const state = _.get(this, 'addressInfo.state');
      const stateId = _.get(state, '_id', state);
      const stateFound = this.states.find((s) => s._id === stateId);
      return stateFound;
    },
    countryCode() {
      return _.get(this.country, 'code', '');
    },
  },
};
