export default {
  props: {
    hasWorkflows: {
      type: Boolean,
      default: false,
    },
    hasWorkflowsWithSameLanguageCombinations: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      workflowCreationStrategy: null,
    };
  },
  computed: {
    workflowCreationStrategyNew() { return 'CREATE_NEW'; },
    workflowCreationStrategyExisting() { return 'USE_EXISTING'; },
    isExistingWorkflowOptionDisabled() {
      return !this.hasWorkflows || this.hasWorkflowsWithSameLanguageCombinations;
    },
  },
  methods: {
    open() {
      this.workflowCreationStrategy = this.workflowCreationStrategyNew;
      this.$refs.modal.show();
    },
    close() {
      this.$refs.modal.hide();
    },
    runCatImport() {
      this.$emit('import', this.workflowCreationStrategy);
      this.close();
    },
  },
};
