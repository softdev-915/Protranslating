<template>
  <div>
    <input
      type="text"
      class="form-control"
      :disabled="disabled"
      :value="inputValue"
      @click="showModal"
      @keydown.enter="applyDate"
      @keydown.delete="resetDate"
      readonly
    />
    <i class="dropdown icon"></i>
    <dynamic-utc-range-flatpickr
      class="date-picker border border-dark rounded"
      v-show="isModalVisible"
      v-model="date"
      :allowed-ranges="allowedDateRanges"
      @apply="applyDate"
    />
  </div>
</template>
<script>
import _ from 'lodash';
import moment from 'moment';
import DynamicUtcRangeFlatpickr from './dynamic-utc-range-flatpickr.vue';
import { RANGES, FMT } from './dynamic-utc-range-consts';

export default {
  components: {
    DynamicUtcRangeFlatpickr,
  },
  props: {
    value: {
      required: true,
      type: String,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    titleDateFormat: {
      type: String,
      default: 'MMM D, YYYY',
    },
    titleDatesSeparator: {
      type: String,
      default: ' - ',
    },
  },
  data() {
    return {
      isModalVisible: false,
      defaultValue: this.value,
      date: this.value,
      allowedDateRanges: ['lastYear', 'thisYear', 'yearToDate', 'previousThirtyDays', 'previousSevenDays', 'today', 'thisMonth'],
    };
  },
  computed: {
    inputValue() {
      const existedRangeName = _.get(RANGES, [this.value, 'name']);
      if (!_.isNil(existedRangeName)) {
        return existedRangeName;
      }
      const dates = this.value.split(',');
      const formattedDates = dates.map(date => moment(date, FMT).format(this.titleDateFormat));
      return formattedDates.join(this.titleDatesSeparator);
    },
  },
  methods: {
    applyDate() {
      this.hideModal();
      this.setValue(this.date);
    },
    resetDate() {
      this.hideModal();
      this.setValue(this.defaultValue);
    },
    showModal() {
      this.isModalVisible = true;
    },
    hideModal() {
      this.isModalVisible = false;
    },
    setValue(value) {
      this.$emit('input', value);
    },
  },
};
</script>
