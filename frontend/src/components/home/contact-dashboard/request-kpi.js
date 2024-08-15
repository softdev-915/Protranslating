import _ from 'lodash';
import { mapActions } from 'vuex';
import KpiCard from './kpi-card.vue';
import ContactDashboardService from '../../../services/contact-dashboard-service';

const contactDashboardService = new ContactDashboardService();

export default {
  components: { KpiCard },
  data() {
    return {
      kpiData: {
        requestsToBeProcessed: 0,
        requestsInProgress: 0,
        requestsWaitingForQuote: 0,
        requestsWaitingForApproval: 0,
      },
    };
  },
  async created() {
    await this.loadKpiData();
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    async loadKpiData() {
      try {
        const { data } = await contactDashboardService.getRequestKpiData();
        this.kpiData = _.assign(this.kpiData, data);
      } catch (e) {
        this.pushNotification({
          title: 'Error',
          message: 'Could not retrieve request KPI data',
          state: 'danger',
          response: e,
          ttl: 3,
        });
      }
    },
  },
};
