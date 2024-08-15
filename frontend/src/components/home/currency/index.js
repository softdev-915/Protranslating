import { mapGetters } from 'vuex';
import CurrencySection from './currency-section.vue';
import SectionContainer from '../../section-container/section-container.vue';

export default {
  components: {
    CurrencySection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
  },
};
