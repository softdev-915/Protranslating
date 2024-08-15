import { mapGetters } from 'vuex';
import QuoteSection from './quote-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

const VALID_QUOTE_READ_ROLES = ['QUOTE_READ_ALL', 'QUOTE_READ_OWN', 'QUOTE_READ_COMPANY'];
const QUOTE_LIST_ROUTE_NAME = 'quotes';

export default {
  components: {
    SectionContainer,
    QuoteSection,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return VALID_QUOTE_READ_ROLES.some((role) => hasRole(this.userLogged, role));
    },
    quoteSectionClass() {
      if (this.$route.name !== QUOTE_LIST_ROUTE_NAME) {
        return 'full-section-container';
      }
      return '';
    },
  },
};
