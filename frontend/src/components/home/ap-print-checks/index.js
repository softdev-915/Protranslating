import { mapGetters } from 'vuex';
import ApPrintChecksSection from './ap-print-checks-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import userRoleCheckMixin from '../../../mixins/user-role-check';

export default {
  mixins: [userRoleCheckMixin],
  components: {
    ApPrintChecksSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return this.hasRole('AP-PAYMENT_READ_ALL');
    },
  },
};
