import { mapGetters } from 'vuex';
import BillAdjustmentSection from './bill-adjustment-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

export default {
  components: {
    BillAdjustmentSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return ['BILL-ADJUSTMENT_READ_ALL', 'BILL-ADJUSTMENT_READ_OWN'].some((r) => hasRole(this.userLogged, r));
    },
  },
};
