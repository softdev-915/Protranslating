import ServerPaginationGrid from '../../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import WorkflowTemplateService from '../../../../services/workflow-template-service.js';
import GridDeleteButton from './workflow-templates-grid-delete-button.vue';

export default {
  name: 'CompanyWorkflowTemplateSection',
  props: {
    companyId: {
      type: String,
    },
  },
  data: () => ({
    isExpanded: false,
    isGridShown: false,
    service: new WorkflowTemplateService(),
  }),
  components: {
    ServerPaginationGrid,
  },
  created() {
    this.components = { GridDeleteButton };
  },
  computed: {
    toggleButtonText() {
      return this.isExpanded ? 'Hide Workflow Templates' : 'Show Workflow Templates';
    },
    query() {
      return { companyId: this.companyId };
    },
  },
  methods: {
    toggleSection() {
      if (!this.isGridShown) {
        this.isGridShown = true;
      }
      this.isExpanded = !this.isExpanded;
    },
  },
};
