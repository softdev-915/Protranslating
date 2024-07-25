import _ from 'lodash';
import moment from 'moment';
import FlatPickr from 'vue-flatpickr-component';

const CUSTOM_PROPS = ['value', 'format', 'disabled'];
const CUSTOM_LISTENERS = ['input'];
/**
 * @deprecated Use <flatpickr> component which is a wrapped version of an original <flat-pickr>
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
    format: {
      type: String,
      default: () => 'YYYY-MM-DD HH:mm',
    },
    value: {
      type: [String, Object],
      default: '',
    },
    ..._.omit(FlatPickr.props, CUSTOM_PROPS),
  },
  data() {
    return {
      clientDate: null,
      clientDateStr: null,
      triggeredDisabled: false,
    };
  },
  computed: {
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
    isoDate() {
      if (this.clientDate) {
        return this.clientDate.utc().toISOString();
      }
      return null;
    },
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
    value: {
      immediate: true,
      handler(newValue, oldValue) {
        if (newValue !== oldValue) {
          this._onInputChange(newValue);
        }
      },
    },
    isoDate(newValue, oldValue) {
      if (newValue !== oldValue && !this.disabled) {
        this.$emit('input', newValue);
      }
    },
    clientDateStr(newClientDate) {
      // client date will always be in client hour
      const clientMoment = moment(newClientDate);
      if (clientMoment.isValid()) {
        this.clientDate = clientMoment.utc();
      } else {
        this.clientDateStr = null;
        this.clientDate = null;
      }
    },
  },
  methods: {
    _onInputChange(newValue) {
      // value will always be utc date
      const mom = moment(newValue).utc();
      if (mom.isValid()) {
        if (!this.clientDate || !mom.isSame(this.clientDate)) {
          this.clientDateStr = mom.utcOffset(moment().utcOffset()).format(this.format);
          this.clientDate = mom;
        }
      }
    },
  },
};
