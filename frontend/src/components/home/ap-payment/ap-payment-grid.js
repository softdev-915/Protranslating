import { mapGetters } from 'vuex';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import ApPaymentService from '../../../services/ap-payment-service';
import userRoleCheckMixin from '../../../mixins/user-role-check';

export default {
  mixins: [userRoleCheckMixin],
  components: {
    ServerPaginationGrid,
  },
  created() {
    this.apPaymentService = new ApPaymentService(this.userLogged);
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate() {
      return this.hasRole('AP-PAYMENT_CREATE_ALL');
    },
  },
  methods: {
    onEdit(eventData) {
      this.$emit('ap-payment-details', eventData);
    },
    onCreate() {
      this.$emit('ap-payment-creation');
    },
  },
};
