import { mapGetters } from 'vuex';
import TaskSection from './task-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

const TASK_DETAIL_ROUTE_NAME = 'task-detail';

export default {
  components: {
    SectionContainer,
    TaskSection,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return ['TASK_READ_ALL', 'TASK_READ_OWN'].some((role) => hasRole(this.userLogged, role));
    },
    taskSectionClass() {
      if (this.$route.name === TASK_DETAIL_ROUTE_NAME) {
        return 'full-section-container';
      }
      return '';
    },
  },
};
