import _ from 'lodash';
import { mapGetters } from 'vuex';
import DynamicUtcRangeFlatpickr from '../../form/dynamic-utc-range-flatpickr.vue';
import { hasRole } from '../../../utils/user';

export default {
  components: {
    DynamicUtcRangeFlatpickr,
  },
  props: {
    dashboardData: {
      type: Object,
      required: true,
    },
    dateFilterAmountPosted: {
      type: String,
      required: true,
    },
    dateFilterAmountPaid: {
      type: String,
      required: true,
    },
    defaultFilter: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      showDateRangeTotalAmountPosted: false,
      showDateRangeTotalAmountPaid: false,
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canEditDateRange() {
      return hasRole(this.userLogged, 'VENDOR-DASHBOARD-FILTER_READ_OWN');
    },
    allowedDateRanges() {
      return ['lastYear', 'thisYear', 'yearToDate', 'previousThirtyDays', 'previousSevenDays', 'today'];
    },
    totalBalanceAmount() {
      return _.get(this, 'dashboardData.totalBalanceAmount', 0);
    },
    totalAmountPosted() {
      return _.get(this, 'dashboardData.totalAmountPosted', 0);
    },
    totalAmountPaid() {
      return _.get(this, 'dashboardData.totalAmountPaid', 0);
    },
    totalAmountPostedDateFilter: {
      get() {
        return this.dateFilterAmountPosted;
      },
      set(value) {
        this.$emit('set-date-filter-amount-posted', value);
      },
    },
    totalAmountPaidDateFilter: {
      get() {
        return this.dateFilterAmountPaid;
      },
      set(value) {
        this.$emit('set-date-filter-amount-paid', value);
      },
    },
  },
  methods: {
    showDateRangeForAmountPosted() {
      this.showDateRangeTotalAmountPosted = true;
      this.showDateRangeTotalAmountPaid = false;
    },
    showDateRangeForAmountPaid() {
      this.showDateRangeTotalAmountPosted = false;
      this.showDateRangeTotalAmountPaid = true;
    },
    applyDateFilter() {
      this.showDateRangeTotalAmountPosted = false;
      this.showDateRangeTotalAmountPaid = false;
      this.$emit('apply-date-filter');
    },
    resetDateRangeTotalAmountPosted() {
      this.totalAmountPostedDateFilter = this.defaultFilter;
      this.showDateRangeTotalAmountPosted = false;
      this.$emit('apply-date-filter');
    },
    resetDateRangeTotalAmountPaid() {
      this.totalAmountPaidDateFilter = this.defaultFilter;
      this.showDateRangeTotalAmountPaid = false;
      this.$emit('apply-date-filter');
    },
  },
};
