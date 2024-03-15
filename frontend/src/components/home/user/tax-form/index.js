import { mapGetters } from 'vuex';
import TaxFormSection from './tax-form-section.vue';
import SectionContainer from '../../../section-container/section-container.vue';
import { hasRole } from '../../../../utils/user';

export default {
  components: {
    TaxFormSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'VENDOR_CREATE_ALL') || hasRole(this.userLogged, 'VENDOR_UPDATE_ALL');
    },
  },
};
