import { mapGetters } from 'vuex';
import LspSection from './lsp-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

const VALID_LSP_ROLES = ['LSP-SETTINGS_READ_OWN', 'LSP-SETTINGS_UPDATE_OWN'];

export default {
  components: {
    SectionContainer,
    LspSection,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canReadOrEdit() {
      return VALID_LSP_ROLES.some((role) => hasRole(this.userLogged, role));
    },
  },
};
