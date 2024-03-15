import { mapActions } from 'vuex';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import ContactDashboardService from '../../../services/contact-dashboard-service';
import PeriodSelector from '../../form/period-selector.vue';
import SimpleGridTable from '../../responsive-grid/simple-grid-table/simple-grid-table.vue';

const contactDashboardService = new ContactDashboardService();

export default {
  mixins: [userRoleCheckMixin],
  components: {
    PeriodSelector,
    SimpleGridTable,
  },
  data() {
    return {
      datePeriod: 'yearToDate',
      kpiData: {
        list: [],
        total: 0,
      },
      columns: [
        {
          name: 'Company Hierarchy',
          prop: 'companyHierarchy',
          type: 'string',
          visible: true,
        },
        {
          name: 'Company Name',
          prop: 'companyName',
          type: 'string',
          visible: true,
        },
        {
          name: 'Total Invoices',
          prop: 'totalInvoices',
          type: 'string',
          visible: true,
          val: item => `${item.currency} ${item.totalInvoices}`,
        },
        {
          name: 'Total Paid Invoices',
          prop: 'totalPaidInvoices',
          type: 'string',
          visible: true,
          val: item => `${item.currency} ${item.totalPaidInvoices}`,
        },
        {
          name: 'Total Partially Paid Invoices',
          prop: 'totalPartiallyPaidInvoices',
          type: 'string',
          visible: true,
          val: item => `${item.currency} ${item.totalPartiallyPaidInvoices}`,
        },
        {
          name: 'Total Balance',
          prop: 'totalBalance',
          type: 'string',
          visible: true,
          val: item => `${item.currency} ${item.totalBalance}`,
        },
      ],
      isDataVisible: false,
      isLoadedKpiData: false,
      isLoadingKpiData: false,
      page: 1,
      pageSize: 10,
    };
  },
  computed: {
    canEditDate() {
      return this.hasRole('CONTACT-DASHBOARD-FILTER_READ_OWN');
    },
    showDataLabel() {
      return `${this.isDataVisible ? 'Hide' : 'Show'} invoices data`;
    },
  },
  watch: {
    datePeriod(newValue, oldValue) {
      if (newValue === oldValue) {
        return;
      }
      if (!this.isDataVisible) {
        this.isLoadedKpiData = false;
        return;
      }
      this.$nextTick(async () => {
        await this.loadKpiData();
      });
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    async loadKpiData() {
      this.isLoadingKpiData = true;
      try {
        const { data } = await contactDashboardService.getInvoiceKpiData(
          this.datePeriod,
          { limit: this.pageSize, page: this.page },
        );
        this.kpiData.list = data.list;
        this.kpiData.total = data.total;
        this.isLoadedKpiData = true;
        this.isLoadingKpiData = false;
      } catch (e) {
        this.isLoadingKpiData = false;
        this.pushNotification({
          title: 'Error',
          message: 'Could not retrieve invoice KPI data',
          state: 'danger',
          response: e,
          ttl: 3,
        });
      }
    },
    async toggleDataVisibility() {
      if (!this.isLoadedKpiData) {
        await this.loadKpiData();
      }
      this.isDataVisible = !this.isDataVisible;
    },
    async onPageChange(page) {
      this.page = page;
      await this.loadKpiData();
    },
    async onPageSizeChange(pageSize) {
      this.pageSize = pageSize;
      await this.loadKpiData();
    },
  },
};
