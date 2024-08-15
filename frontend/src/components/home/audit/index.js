import { mapGetters } from 'vuex';
import AuditSection from './audit-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

const validRoles = ['AUDIT_READ_ALL'];

export default {
  components: {
    SectionContainer,
    AuditSection,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return validRoles.some((role) => hasRole(this.userLogged, role));
    },
    sectionTitle() {
      return this.canRead ? 'Audit' : 'Forbidden';
    },
  },
  mounted() {
    if (this.canRead) {
      this.$refs.breadcrumb.items = [{
        text: 'Audit',
        link: '/list-audit',
        type: 'audit-grid',
        ts: 0,
        active: true,
      }];
    }
  },
};
