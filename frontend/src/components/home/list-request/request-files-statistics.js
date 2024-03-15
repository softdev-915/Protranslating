import { mapActions, mapGetters } from 'vuex';
import _ from 'lodash';
import { hasRole } from '../../../utils/user';
import StatisticsTab from './statistics-tab/statistics-tab.vue';
import RequestService from '../../../services/request-service';

const requestService = new RequestService();

export default {
  components: {
    StatisticsTab,
  },
  data() {
    return {
      loading: false,
      tabs: [],
      activeTab: 'client',
      request: null,
    };
  },
  async created() {
    const canReadAll = hasRole(this.userLogged, 'STATISTICS_READ_ALL');
    const canReadCompany = hasRole(this.userLogged, 'STATISTICS_READ_COMPANY');
    const canReadOwn = hasRole(this.userLogged, 'STATISTICS_READ_OWN');
    const clientTab = {
      name: 'client',
      withFuzzyMatches: false,
    };
    const providerTab = {
      name: 'provider',
      withFuzzyMatches: true,
    };

    if (canReadAll || (canReadCompany && canReadOwn)) {
      this.tabs = [clientTab, providerTab];
    } else if (canReadCompany) {
      this.tabs = [clientTab];
    } else if (canReadOwn) {
      this.tabs = [providerTab];
    } else {
      this.pushNotification({
        title: 'Error',
        message: 'User is not authorized',
        state: 'danger',
      });
      return;
    }
    this.activeTab = _.get(this, 'tabs[0].name');

    try {
      this.loading = true;
      const { params: { requestId } } = this.$route;
      const { data: { request } } = await requestService.get(requestId);
      this.request = request;
    } catch (error) {
      this.pushNotification({
        title: 'Error',
        message: _.get(error, 'status.message', 'Something went wrong, please try again later.'),
        state: 'danger',
        response: error,
      });
    } finally {
      this.loading = false;
    }
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onSelectTab(tabName) {
      this.activeTab = tabName;
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
  },
};
