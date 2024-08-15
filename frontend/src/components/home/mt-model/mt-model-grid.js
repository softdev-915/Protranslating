import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import MtModelService from '../../../services/mt-model-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      mtModelService: new MtModelService(),
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'MT-MODEL_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('mt-model-creation');
    },
    onEdit(eventData) {
      this.$emit('mt-model-edition', eventData);
    },
  },
};
