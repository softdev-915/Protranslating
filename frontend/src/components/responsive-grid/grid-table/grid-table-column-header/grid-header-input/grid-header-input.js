import _ from 'lodash';
import moment from 'moment';
import { mapGetters } from 'vuex';

import sessionObserver from '../../../../../utils/observers/session';
import DynamicUtcRangeFlatpickr from '../../../../form/dynamic-utc-range-flatpickr.vue';

const trueRegexp = /t$|tr$|tru$|true$/i;
const falseRegexp = /f$|fa$|fal$|fals$|false$/i;
const buildInitialState = () => ({
  inputData: '',
  rangeInput: '',
  rangePickerShow: false,
  showDateRange: false,
  dateRangeInputXPosition: null,
  dateRangeInputRefHack: null,
});

export default {
  components: {
    DynamicUtcRangeFlatpickr,
  },
  props: {
    filter: Object,
    column: Object,
    index: Number,
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  created() {
    this._setFilterData(this.filter);
    sessionObserver.addObserver(this);
  },
  updated() {
    if (this.$refs.dateRangeInput) {
      // hackintosh: $refs are not reactive => https://github.com/vuejs/vue/issues/3842
      this.dateRangeInputRefHack = this.$refs.dateRangeInput;
      // the ref is inside an if, so I cannot use it inside a computed property
      // basically I'm forced to extract the information from an updated hook.
      // FIXME: When moving the column, the position is not adjusting.
      const bodyRect = document.body.getBoundingClientRect();
      const elemRect = this.$refs.dateRangeInput.getBoundingClientRect();
      const offsetX = elemRect.left - bodyRect.left;
      // get the X left offset of the input
      this.dateRangeInputXPosition = offsetX;
    }
    return null;
  },
  data: () => buildInitialState(),
  computed: {
    ...mapGetters('app', ['globalEvent']),
    elementId() {
      return `${this.column.prop}-${this.index}`;
    },
    dataRangeE2EType() {
      return `utc-range-selector-${this.column.prop}`;
    },
    isBoolean() {
      const type = _.get(this.column, 'type');
      return type === 'boolean' || type === 'toggle';
    },
    dateRangePosition() {
      // if the input has space to the left, center the range input, if not
      // then leave it as is.
      if (this.dateRangeInputXPosition && this.dateRangeInputXPosition > 300) {
        return { left: '-300px' };
      }
      return null;
    },
  },
  watch: {
    filter(newFilter) {
      this._setFilterData(newFilter);
    },
    value(newValue) {
      if (this.isBoolean) {
        if (this.inputData === '') {
          this.inputData = newValue;
        } else if (newValue === true && !this.inputData.match(trueRegexp)) {
          this.inputData = newValue;
        } else if (newValue === false && !this.inputData.match(falseRegexp)) {
          this.inputData = newValue;
        }
      } else {
        this.inputData = newValue;
      }
    },
    inputData(newInputData) {
      if (_.isNil(newInputData) && this.column.type === 'dateRange') {
        this.rangeInput = undefined;
      }
      if (newInputData !== this.value) {
        this.$emit('input', this.inputData);
      }
    },
    globalEvent({ event }) {
      if (!_.isNil(event)) {
        const targetInput = event.target.querySelector('input');
        if (this.dateRangeInputRefHack && this.dateRangeInputRefHack !== event.target
          && targetInput !== this.dateRangeInputRefHack) {
          this.showDateRange = false;
        }
      }
    },
    rangeInput(newValue) {
      if (_.isArray(newValue)) {
        this.inputData = newValue.join(',');
      } else {
        this.inputData = newValue;
      }
    },
  },
  methods: {
    fireFilter(data) {
      data = data || this.inputData;
      const filterInfo = this._filterValue(data);
      this.$emit('grid-filter', filterInfo);
    },
    clearFilter() {
      // if the value is empty, the filter property will be removed by the
      // grid mixin.
      const filterInfo = this._filterValue('');
      Object.assign(this, buildInitialState());
      this.$emit('grid-column-filter-clear', filterInfo);
    },
    onDateRangeApply() {
      this.fireFilter();
    },
    openModal() {
      this.rangePickerShow = true;
    },
    onLogin() {
      this.showDateRange = false;
    },
    onLogout() {
      this.showDateRange = false;
    },
    _setFilterData(newFilter) {
      let val = '';
      if (newFilter) {
        val = _.get(newFilter, this.column.queryKey || this.column.prop);
      }
      if (this.isBoolean) {
        if (this.inputData === '') {
          this.inputData = val;
        } else if (val === true && !this.inputData.match(trueRegexp)) {
          this.inputData = val;
        } else if (val === false && !this.inputData.match(falseRegexp)) {
          this.inputData = val;
        } else if (_.isNil(val)) {
          this.inputData = '';
        }
      } else {
        this.inputData = val;
      }
    },
    _filterValue(value) {
      let __tz;
      let properValue = value;
      const filterKey = this.column.queryKey || this.column.prop;
      if (value) {
        if (this.column.type === 'date') {
          __tz = moment().utcOffset();
        } else if (this.isBoolean) {
          if (value.match(trueRegexp)) {
            properValue = true;
          } else if (value.match(falseRegexp)) {
            properValue = false;
          } else {
            return this.clearFilter();
          }
        }
      }
      return {
        filterValue: properValue,
        filterKey,
        __tz,
      };
    },
  },
};
