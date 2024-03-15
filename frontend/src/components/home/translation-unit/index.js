import { mapGetters } from 'vuex';
import TranslationUnitSection from './translation-unit-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

export default {
  components: {
    TranslationUnitSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'TRANSLATION-UNIT_READ_ALL');
    },
  },
};
