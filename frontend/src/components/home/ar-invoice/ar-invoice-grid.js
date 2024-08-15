import { mapActions } from 'vuex';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import ArInvoiceService from '../../../services/ar-invoice-service';
import userRoleCheckMixin from '../../../mixins/user-role-check';

const CREATE_ROLES = ['INVOICE_CREATE_ALL', 'INVOICE-ACCT_READ_ALL'];
const READ_ROLES = ['INVOICE_READ_ALL', 'INVOICE_READ_OWN', 'INVOICE_READ_COMPANY'];

export default {
  mixins: [userRoleCheckMixin],
  components: {
    ServerPaginationGrid,
  },
  created() {
    this.arInvoiceService = new ArInvoiceService();
  },
  computed: {
    canCreate() {
      return this.hasRole(CREATE_ROLES);
    },
    canRead() {
      return READ_ROLES.some((r) => this.hasRole(r));
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('invoice-creation');
    },
    onEdit(eventData) {
      if (this.canRead && !this.canCreate) {
        this.$emit('invoice-preview', eventData.item._id);
      } else if (this.canCreate) {
        this.$emit('invoice-edition', eventData);
      }
    },
  },
};
