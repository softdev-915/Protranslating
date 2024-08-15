import { mapGetters } from 'vuex';
import AbilitySection from './ability-section.vue';
import SectionContainer from '../../../section-container/section-container.vue';
import userRoleCheckMixin from '../../../../mixins/user-role-check';

export default {
  mixins: [userRoleCheckMixin],
  components: {
    AbilitySection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return this.hasRole({ oneOf: ['USER_READ_ALL', 'ABILITY_READ_ALL'] });
    },
  },
};
