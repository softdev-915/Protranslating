import { mapGetters } from 'vuex';
import userRoleCheckMixin from '../../../mixins/user-role-check';

export default {
  mixins: [userRoleCheckMixin],
  props: {
    allWorkflowsSelected: {
      type: Boolean,
      default: false,
    },
    canEditAll: {
      type: Boolean,
      default: false,
    },
    canDelete: {
      type: Boolean,
      default: true,
    },
    isWorkflowInEditMode: {
      type: Boolean,
      default: false,
    },
    isCatImportRunning: {
      type: Boolean,
      default: false,
    },
    isValidRequest: {
      type: Boolean,
      default: false,
    },
    isRequestCompleted: {
      type: Boolean,
      default: false,
    },
    isRequestDelivered: {
      type: Boolean,
      default: false,
    },
    companyId: String,
  },
  data() {
    return {
      allSelected: false,
      toggledWorkflowProviderTaskSections: {
        projectedCostVisible: true,
        billVisible: true,
        invoiceVisible: true,
      },
    };
  },
  created() {
    if (this.hasRole('TASK_READ_OWN') && !this.hasRole('TASK_READ_ALL')) {
      this.toggledWorkflowProviderTaskSections.billVisible = true;
    }
  },
  watch: {
    allWorkflowsSelected(newAllWorkflowsSelected) {
      this.allSelected = newAllWorkflowsSelected;
    },
    toggledWorkflowProviderTaskSections: {
      deep: true,
      handler: function () {
        this.$emit('workflow-provider-task-toggle-sections', this.toggledWorkflowProviderTaskSections);
      },
    },
    'toggledWorkflowProviderTaskSections.projectedCostVisible'() {
      this.$ua.trackEvent('Request - Workflows', 'Click', 'Projected Cost-Checkbox');
    },
    'toggledWorkflowProviderTaskSections.billVisible'() {
      this.$ua.trackEvent('Request - Workflows', 'Click', 'Bill-Checkbox');
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canReadProjectedCost() {
      return this.hasRole('TASK-FINANCIAL_READ_ALL');
    },
    canReadFinancialSections() {
      return this.hasRole('TASK-FINANCIAL_READ_ALL');
    },
    canCopyWorkflow() {
      return !this.isWorkflowInEditMode &&
              this.isValidRequest &&
              !this.isCatImportRunning;
    },
    canDeleteWorkflow() {
      return this.canDelete &&
              !this.isWorkflowInEditMode &&
              !this.isRequestCompleted &&
              !this.isCatImportRunning;
    },
    canPasteWorkflow() {
      return this.canAddWorkflow;
    },
    canAddWorkflow() {
      return this.canCopyWorkflow && !this.isRequestCompleted;
    },
    isRequestCompletedOrDelivered() {
      return this.isRequestCompleted || this.isRequestDelivered;
    },
  },
  methods: {
    addWorkflow() {
      this.$emit('workflow-add');
    },
    copySelectedWorkflows() {
      this.$emit('workflow-copy');
    },
    deleteWorkflows() {
      this.$emit('workflow-delete');
    },
    notifySelectedAll() {
      this.allSelected = !this.allSelected;
      this.$emit('workflow-select-all', this.allSelected);
    },
    pasteWorkflows() {
      this.$emit('workflow-paste');
    },
    onQuoteDetailOpen() {
      this.$emit('quote-detail-open');
    },
  },
};
