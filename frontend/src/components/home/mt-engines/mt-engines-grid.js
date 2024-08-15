import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import MtEnginesService from '../../../services/mt-engine-service';

const mtEnginesService = new MtEnginesService();

export default {
  components: {
    ServerPaginationGrid,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate() {
      return hasRole(this.userLogged, 'MT-ENGINES_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    _service() {
      return mtEnginesService;
    },
    onCreateNew() {
      this.$emit('mt-engine-creation');
    },
    onEdit(eventData) {
      this.$emit('mt-engine-edition', eventData);
    },
  },
};
