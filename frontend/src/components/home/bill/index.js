import { mapGetters } from 'vuex';
import BillSection from './bill-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

export default {
  components: {
    BillSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return ['BILL_READ_ALL', 'BILL_READ_OWN'].some((r) => hasRole(this.userLogged, r));
    },
  },
};
