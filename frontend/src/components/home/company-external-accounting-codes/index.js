import { mapGetters } from 'vuex';
import SectionContainer from '../../section-container/section-container.vue';
import CompanyExternalAccountingCodesSection from './company-external-accounting-codes-section.vue';
import { hasRole } from '../../../utils/user';

export default {
  components: {
    SectionContainer,
    CompanyExternalAccountingCodesSection,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'EXTERNAL-ACCOUNTING-CODE_READ_ALL');
    },
  },
};
