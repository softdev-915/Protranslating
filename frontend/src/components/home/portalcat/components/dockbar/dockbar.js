import _ from 'lodash';
import PortalCatStoreMixin from '../../mixins/pc-store-mixin';
import UserRoleCheckMixin from '../../../../../mixins/user-role-check';

export default {
  mixins: [
    PortalCatStoreMixin,
    UserRoleCheckMixin,
  ],
  props: {
    value: {
      type: Object,
      default: {},
    },
  },
  computed: {
    requestTitle() {
      return _.get(this.request, 'title', '');
    },
    sourceLanguage() {
      return _.get(this.workflow, 'srcLang.name', '');
    },
    targetLanguage() {
      return _.get(this.workflow, 'tgtLang.name', '');
    },
    taskName() {
      return _.get(this.task, 'ability', '');
    },
    widgets() {
      return _.get(this.value, 'widgets', []);
    },
    canEnterMemoryEditor() {
      return this.hasRole({ oneOf: ['CAT-RESOURCES_READ_ALL', 'CAT-RESOURCES_UPDATE_ALL'] });
    },
  },
  methods: {
    navigateToMemoryEditor() {
      const companyId = _.get(this, 'request.company._id');
      const requestId = _.get(this, 'request._id');
      const taskId = _.get(this, 'task._id');
      const srcLang = _.get(this, 'workflow.srcLang.isoCode');
      const tgtLang = _.get(this, 'workflow.tgtLang.isoCode');
      const routerProps = {
        params: { entityId: companyId },
        query: { srcLang, tgtLang },
      };
      const { name } = this.$route;
      switch (name) {
        case 'task-grid-portal-cat': {
          routerProps.name = 'task-grid-portal-cat-memory-editor';
          routerProps.params.requestId = requestId;
          routerProps.params.taskId = taskId;
          break;
        }
        case _.get(name.match(/^(task-portal-cat|portal-cat)$/), 'input', ''): {
          routerProps.name = 'task-management-portal-cat-memory-editor';
          routerProps.params.requestId = requestId;
          break;
        }
        default: {
          routerProps.name = 'company-memory-editor';
        }
      }
      this.$router.push(routerProps);
    },
  },
};
