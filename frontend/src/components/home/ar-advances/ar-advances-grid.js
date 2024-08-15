import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import AdvanceService from '../../../services/ar-advance-service';

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
    this.service = new AdvanceService();
  },
  methods: {
    onCreateNew() {
      this.$router.push({ name: 'advance-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      const params = { entityId: eventData.item._id };
      this.$router.push({ name: 'advance-edition', params }).catch((err) => { console.log(err); });
    },
  },
};
