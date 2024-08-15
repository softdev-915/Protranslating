import { mapGetters } from 'vuex';
import CompanyMinimumChargeService from '../../../services/company-minimum-charge-service';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';

export default {
  components: {
    ServerPaginationGrid,
  },
  props: {
    query: Object,
  },
  created() {
    this.service = new CompanyMinimumChargeService();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate() {
      return hasRole(this.userLogged, 'COMPANY-MIN-CHARGE_CREATE_ALL');
    },
  },
  methods: {
    onCreate() {
      this.$emit('company-minimum-charge-creation');
    },
    onEdit(eventData) {
      this.$emit('company-minimum-charge-edition', eventData);
    },
  },
};
