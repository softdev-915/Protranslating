import { mapActions, mapGetters } from 'vuex';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import PpoService from '../../../services/provider-pooling-offer-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  props: {
    query: {
      type: Object,
    },
  },
  created() {
    this.ppoService = new PpoService();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onEdit(event) {
      this.$emit('ppo-edit', event);
    },
    keyProp(item, index) {
      return `${item._id}_${index}`;
    },
  },
};
