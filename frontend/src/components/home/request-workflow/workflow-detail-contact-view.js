import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';
import WorkflowTitle from './workflow-title.vue';
import WorkflowTaskDetailContactReadOnly from './workflow-task-detail-contact-read-only.vue';

export default {
  components: {
    WorkflowTitle,
    WorkflowTaskDetailContactReadOnly,
  },
  props: {
    workflow: {
      type: Object,
      required: true,
    },
    request: {
      type: Object,
      required: true,
    },
    company: {
      type: String,
    },
    workflowIndex: {
      type: Number,
      required: true,
    },
    isCollapsed: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      loading: false,
      cached: false,
      collapsed: this.isCollapsed,
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'lsp']),
    srcLang() {
      return _.get(this.workflow, 'srcLang.name', '');
    },
    tgtLang() {
      return _.get(this.workflow, 'tgtLang.name', '');
    },
  },
  watch: {
    collapsed(isCollapsed) {
      this.$emit('workflow-collapsed', isCollapsed);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    toggleCollapse() {
      this.collapsed = !this.collapsed;
    },
  },
};
