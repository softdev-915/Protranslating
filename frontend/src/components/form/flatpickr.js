import _ from 'lodash';
import moment from 'moment-timezone';
import FlatPickr from 'vue-flatpickr-component';
import { mapGetters } from 'vuex';

const CUSTOM_PROPS = ['value', 'disabled'];
const CUSTOM_LISTENERS = ['input'];
/**
 * This is a new version of <utc-flatpickr> component that wraps up the original <flat-pickr> and
 * additionally includes timezone-related logic and more.
 * <utc-flatpickr> is deprecated and will be fully removed soon
 */
export default {
  components: {
    FlatPickr,
  },
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    value: {
      type: [String, Object],
      default: '',
    },
    ..._.omit(FlatPickr.props, CUSTOM_PROPS),
  },
  data() {
    return {
      triggeredDisabled: false,
    };
  },
  watch: {
    disabled: {
      immediate: true,
      handler(newValue) {
        this.$nextTick(() => {
          this.triggeredDisabled = newValue;
        });
      },
    },
  },
  computed: {
    ...mapGetters('features', ['mockTimezone']),
    ...mapGetters('app', ['userLogged']),
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
    timezone() {
      const userTimezone = _.get(this.userLogged, 'timeZone.value');
      return this.mockTimezone ? this.mockTimezone : userTimezone;
    },
    isTimezoneNameValid() {
      const isTzNameValid = moment.tz.zone(this.timezone);
      return !_.isNil(isTzNameValid);
    },
    localDate() {
      if (this.isTimezoneNameValid) {
        const utc0Date = moment.tz(this.value, 'UTC');
        if (!utc0Date.isValid()) return null;
        return utc0Date.clone().tz(this.timezone).format('YYYY-MM-DD HH:mm:ss Z');
      }
      return null;
    },
  },
  methods: {
    setDate(newValue) {
      this.$emit('input', moment.tz(newValue, this.timezone).utc());
    },
  },
};
