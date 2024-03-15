import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import userRoleCheckMixin from '../../../../mixins/user-role-check';
import NotificationMixin from '../../../../mixins/notification-mixin';
import SimpleBasicSelect from '../../../form/simple-basic-select.vue';
import BillService from '../../../../services/bill-service';
import TemplateService from '../../../../services/template-service';
import ReportPreview from '../../../report-preview/report-preview.vue';

const billService = new BillService();
const templateService = new TemplateService();
const BILL_TYPE = 'Bill';
const DEFAULT_TEMPLATE = 'monthly-bill-template';

export default {
  mixins: [
    userRoleCheckMixin,
    NotificationMixin,
  ],
  components: {
    SimpleBasicSelect,
    ReportPreview,
  },
  data() {
    return {
      isDownloadingPdf: false,
      bill: {},
      frame: '',
      footerTemplate: '',
      selectedBillTemplate: '',
      templateList: [],
    };
  },
  created() {
    this.init()
      .catch(e => this.pushError(e.message, e))
      .finally(() => { this.loading = false; });
  },
  computed: {
    ...mapGetters('app', ['lsp', 'userLogged']),
    billId() {
      return this.$route.params.entityId;
    },
    billTemplateOptions() {
      return this.templateList.filter(t => t.type === BILL_TYPE && !t.deleted);
    },
    shouldDisableTemplateSelect() {
      return this.billTemplateOptions.length === 1 &&
        this.billTemplateOptions[0].name === DEFAULT_TEMPLATE;
    },
    canSelectTemplates() {
      return this.hasRole('BILL_UPDATE_ALL');
    },
  },
  methods: {
    ...mapActions('sideBar', ['setCollapsed']),
    ...mapActions('notifications', ['pushNotification']),
    async preview() {
      try {
        const res = await billService.getBillPreview(this.billId, this.selectedBillTemplate);
        this.frame = _.get(res, 'data.template');
        this.footerTemplate = _.get(res, 'data.footerTemplate');
      } catch (err) {
        const notification = {
          title: 'Error',
          message: 'Could not preview a template',
          state: 'danger',
          response: err,
        };
        notification.response = err;
        this.pushNotification(notification);
      }
    },
    async init() {
      await this.retrieveBill();
      await this.retrieveTemplates();
      await this.setDefaultTemplate();
      await this.preview();
    },
    async retrieveBill() {
      const res = await billService.get(this.billId);
      this.bill = _.get(res, 'data.bill', '');
    },
    async retrieveTemplates() {
      const res = await templateService.retrieve();
      this.templateList = _.get(res, 'data.list', []);
    },
    async setDefaultTemplate() {
      const defaultTemplate = this.templateList
        .find(template => template.name === DEFAULT_TEMPLATE);
      if (!_.isNil(defaultTemplate)) {
        this.selectedBillTemplate = defaultTemplate._id;
      }
    },
    closeMenu() {
      return new Promise((resolve) => {
        this.setCollapsed(true);
        setTimeout(resolve, 1000);
      });
    },
    async downloadPdf() {
      if (this.isDownloadingPdf) {
        return;
      }
      this.isDownloadingPdf = true;
      const reportFilename = this.bill.no;
      await this.$refs['report-preview'].downloadPdf(reportFilename);
      this.isDownloadingPdf = false;
    },
    cancel() {
      this.$refs['report-preview'].cancelReportPreviewSettings();
      this.$emit('section-navigate-previous');
    },
  },
};
