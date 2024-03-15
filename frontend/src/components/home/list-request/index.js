import { mapGetters } from 'vuex';
import RequestSection from './request-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

const VALID_REQUEST_READ_ROLES = ['REQUEST_READ_OWN', 'REQUEST_READ_ALL', 'REQUEST_READ_COMPANY'];
const VALID_QUOTE_READ_ROLES = ['QUOTE_READ_OWN', 'QUOTE_READ_ALL', 'QUOTE_READ_COMPANY'];
const REQUEST_LIST_ROUTE_NAMES = ['list-request', 'request-activity-list'];

export default {
  components: {
    SectionContainer,
    RequestSection,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canReadQuotes() {
      return VALID_QUOTE_READ_ROLES.some(role => hasRole(this.userLogged, role));
    },
    canReadRequests() {
      return VALID_REQUEST_READ_ROLES.some(role => hasRole(this.userLogged, role));
    },
    requestSectionClass() {
      if (!REQUEST_LIST_ROUTE_NAMES.includes(this.$route.name)) {
        return 'full-section-container';
      }
      return '';
    },
  },
};
