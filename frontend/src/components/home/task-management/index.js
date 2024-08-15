import { mapGetters } from 'vuex';
import TaskSection from './task-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

const VALID_TASK_READ_ROLES = ['TASK_READ_OWN', 'TASK_READ_ALL'];
const MEMORY_EDITOR_ROUTE_NAME = 'task-management-portal-cat-memory-editor';

export default {
  components: {
    SectionContainer,
    TaskSection,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return VALID_TASK_READ_ROLES.some((r) => hasRole(this.userLogged, r));
    },
    taskSectionClass() {
      return this.$route.name === MEMORY_EDITOR_ROUTE_NAME ? '' : 'full-section-container';
    },
  },
};
