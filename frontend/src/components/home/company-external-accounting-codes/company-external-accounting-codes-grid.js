import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import CompanyExternalAccountingCodesService from '../../../services/company-external-accounting-code-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  created() {
    this.companyExternalAccountingCodesService = new CompanyExternalAccountingCodesService();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'EXTERNAL-ACCOUNTING-CODE_READ_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('company-external-accounting-codes-creation');
    },
    onEdit(eventData) {
      this.$emit('company-external-accounting-codes-edition', eventData);
    },
  },
};
