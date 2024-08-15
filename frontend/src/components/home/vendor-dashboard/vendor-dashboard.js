import { mapActions } from 'vuex';
import VendorDashboardService from '../../../services/vendor-dashboard-service';
import TasksInfo from './tasks-info.vue';
import VendorBalances from './vendor-balances.vue';

const vendorDashboardService = new VendorDashboardService();
const DEFAULT_FILTER = 'yearToDate';

export default {
  components: {
    TasksInfo,
    VendorBalances,
  },
  data() {
    return {
      isLoading: false,
      dashboardData: {},
      dateFilterAmountPosted: DEFAULT_FILTER,
      dateFilterAmountPaid: DEFAULT_FILTER,
      isLoading: false,
    };
  },
  created() {
    this.defaultFilter = DEFAULT_FILTER;
    this.getDashboardData();
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    async getDashboardData() {
      try {
        this.isLoading = true;
        const { data } = await vendorDashboardService
          .getDashboardData(
            this.dateFilterAmountPosted,
            this.dateFilterAmountPaid,
          );
        this.dashboardData = data;
      } catch (e) {
        this.pushNotification({
          title: 'Error',
          message: 'Could not retrieve vendor dashboard data',
          state: 'danger',
          response: e,
          ttl: 3,
        });
      } finally {
        this.isLoading = false;
      }
    },
  },
};
