import { mapGetters } from 'vuex';
import IpInstructionsDeadlineSection from './ip-instructions-deadline-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import userRoleCheckMixin from '../../../mixins/user-role-check';

export default {
  mixins: [userRoleCheckMixin],
  components: {
    IpInstructionsDeadlineSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return this.hasRole('IP-INSTRUCTIONS-DEADLINE_READ_ALL');
    },
  },
};
