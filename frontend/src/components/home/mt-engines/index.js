import { mapGetters } from 'vuex';
import MtEnginesSection from './mt-engines-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

export default {
  components: {
    MtEnginesSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
  },
  methods: {
    hasRole(role) {
      return hasRole(this.userLogged, role);
    },
  },
};
