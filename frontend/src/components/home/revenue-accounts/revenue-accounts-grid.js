import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import AccountService from '../../../services/revenue-account-service';

export default {
  props: {
    canCreate: {
      type: Boolean,
      default: false,
    },
    canEdit: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    ServerPaginationGrid,
  },
  created() {
    this.service = new AccountService();
  },
  methods: {
    onCreateNew() {
      this.$router.push({ name: 'revenue-account-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      const params = { entityId: eventData.item._id };
      this.$router.push({ name: 'revenue-account-edition', params }).catch((err) => { console.log(err); });
    },
  },
};
