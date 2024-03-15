import { mapActions, mapGetters } from 'vuex';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import BillService from '../../../services/bill-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    billService() {
      return new BillService(this.userLogged);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onEdit(eventData) {
      this.$emit('bill-edition', eventData);
    },
  },
};
