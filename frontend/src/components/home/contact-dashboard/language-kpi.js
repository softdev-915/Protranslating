import _ from 'lodash';
import { mapActions } from 'vuex';
import ContactDashboardService from '../../../services/contact-dashboard-service';
import userRoleCheckMixin from '../../../mixins/user-role-check';
import PeriodSelector from '../../form/period-selector.vue';
import LanguageSelector from '../../language-select/language-select.vue';
import SimpleGridTable from '../../responsive-grid/simple-grid-table/simple-grid-table.vue';

const contactDashboardService = new ContactDashboardService();

export default {
  components: {
    LanguageSelector,
    SimpleGridTable,
    PeriodSelector,
  },
  mixins: [userRoleCheckMixin],
  data() {
    return {
      sourceLanguage: {},
      targetLanguage: {},
      datePeriod: 'previousSevenDays',
      kpiData: {
        list: [],
        total: 0,
      },
      columns: [
        {
          name: 'Company Hierarchy',
          prop: 'companyHierarchy',
          type: 'string',
          visible: true },
        {
          name: 'Company Name',
          prop: 'companyName',
          type: 'string',
          visible: true,
        },
        {
          name: 'Request Number',
          prop: 'requestNo',
          type: 'string',
          visible: true,
        },
        {
          name: 'Project Managers',
          prop: 'projectManagers',
          type: 'array',
          visible: true,
          val: item => item.projectManagers.map(pm => `${pm.firstName} ${pm.lastName}`).join(' ,'),
        },
        {
          name: 'Request Invoice Status',
          prop: 'requestInvoiceStatus',
          type: 'string',
          visible: true,
        },
        {
          name: 'Total Amount Spent per Language',
          prop: 'totalAmountSpentPerLang',
          type: 'string',
          visible: true,
          val: item => `${item.currency} ${item.totalAmountSpentPerLang}`,
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
    showTableDataTitle() {
      return `${this.isDataVisible ? 'Hide' : 'Show'} languages data`;
    },
    isEnabledShowTableButton() {
      return !_.isEmpty(this.sourceLanguage) && !_.isEmpty(this.targetLanguage);
    },
  },
  watch: {
    datePeriod(newValue, oldValue) {
      this.loadKpiDataWatcher(newValue, oldValue);
    },
    sourceLanguage(newValue, oldValue) {
      this.loadKpiDataWatcher(newValue, oldValue);
    },
    targetLanguage(newValue, oldValue) {
      this.loadKpiDataWatcher(newValue, oldValue);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    loadKpiDataWatcher(newValue, oldValue) {
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
    async loadKpiData() {
      this.isLoadingKpiData = true;
      try {
        const { data } = await contactDashboardService.getLanguageKpiData(
          this.sourceLanguage.isoCode,
          this.targetLanguage.isoCode,
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
          message: 'Could not retrieve language KPI data',
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
