import { mapGetters } from 'vuex';
import MtModelSection from './mt-model-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

export default {
  components: {
    MtModelSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'MT-MODEL_READ_ALL');
    },
  },
};
