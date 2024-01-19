import _ from 'lodash';
import { RANGES } from './dynamic-utc-range-consts';

import UtcRangeFlatpickr from './utc-range-flatpickr';
import SimpleBasicSelect from './simple-basic-select.vue';

const buildInitialState = () => ({
  selectedRange: null,
  selectedRangeTitle: null,
  hasRangeBeenChosen: false,
});

export default {
  components: { UtcRangeFlatpickr, SimpleBasicSelect },
  props: {
    value: {
      type: [Array, String],
      default: '',
    },
    allowedRanges: {
      type: Array,
      default: () => Object.keys(RANGES),
    },
    config: {
      type: Object,
      default: () => ({ inline: true, allowInput: false }),
    },
  },
  data() {
    return buildInitialState();
  },
  created() {
    this.ranges = _.pick(RANGES, this.allowedRanges);
  },
  computed: {
    rangeKeys() {
      return Object.keys(this.ranges);
    },
    dateRange: {
      get() {
        return this.selectedRange;
      },
      set(value) {
        this.selectedRange = value;
        if (!this.hasRangeBeenChosen) {
          this.$emit('input', value);
        }
      },
    },
    rangeTitle: {
      get() {
        return this.selectedRangeTitle;
      },
      set(value) {
        if (_.isString(value) && this.rangeKeys.includes(value)) {
          this.selectedRangeTitle = value;
          this.selectedRange = RANGES[value].factory();
          this.$emit('input', value);
        }
      },
    },
    rangeOptions() {
      return _.isEmpty(this.ranges) ? [] : _.map(Object.keys(this.ranges), (k) => ({
        text: this.ranges[k].name,
        value: k,
      }));
    },
  },
  methods: {
    onApply() {
      this.$emit('apply', this.value);
    },
    onReset() {
      Object.assign(this, buildInitialState());
    },
    onRangeMouseDown(event, rangeKey) {
      // when changing the date range, the watcher
      // will wipe the rangeChosen value.
      // to avoid this we set the flag to hasRangeBeenChosen
      if (event.which === 1) {
        this.hasRangeBeenChosen = true;
        this.rangeTitle = rangeKey;
      }
    },
    onRangeMouseUp(event) {
      // once the mouse up has been triggered
      // the dateRange value has been updated,
      // so we can set the hasRangeBeenChosen to false
      // in order to enable the flatpickr
      // to change the value on next pick.
      if (event.which === 1) {
        this.hasRangeBeenChosen = false;
      }
    },
  },
};
