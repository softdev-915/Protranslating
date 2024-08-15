import { mapGetters } from 'vuex';
import UserSection from './user-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

export default {
  components: {
    UserSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'USER_READ_ALL');
    },
  },
  mounted() {
    const self = this;
    // check if the breadcrumb exist. The user might not have permissions
    if (self.$refs.userBreadcrumb) {
      self.$refs.userBreadcrumb.items = [{
        text: 'User Grid',
        link: '#',
        type: 'user-inline-grid',
        ts: Date.now(),
        query: null,
        active: true,
      }];
    }
  },
};
