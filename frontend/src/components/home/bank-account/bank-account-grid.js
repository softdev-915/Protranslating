import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import BankAccountService from '../../../services/bank-account-service';

export default {
  props: {
    canCreate: { type: Boolean, default: false },
    canEdit: { type: Boolean, default: false },
  },
  components: { ServerPaginationGrid },
  created() {
    this.service = new BankAccountService();
  },
  methods: {
    onCreateNew() {
      this.$router.push({ name: 'bank-account-creation' }).catch((err) => { console.log(err); });
    },
    onEdit({ item = {} }) {
      this.$router.push({
        name: 'bank-account-edition',
        params: { entityId: item._id },
      }).catch((err) => { console.log(err); });
    },
  },
};
