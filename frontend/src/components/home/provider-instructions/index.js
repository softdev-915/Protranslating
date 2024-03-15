import ProviderInstructionsSection from './provider-instructions-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import userRoleCheckMixin from '../../../mixins/user-role-check';

export default {
  components: {
    ProviderInstructionsSection,
    SectionContainer,
  },
  mixins: [userRoleCheckMixin],
  computed: {
    canRead() {
      return this.hasRole('PROVIDER-TASK-INSTRUCTIONS_READ_ALL');
    },
  },
};
