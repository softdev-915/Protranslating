import { mapGetters } from 'vuex';
import { hasRole } from '../../../../utils/user';
import CertificationService from '../../../../services/certification-service';
import ServerPaginationGrid from '../../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      service: new CertificationService(),
    };
  },
  props: {
    query: Object,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate() {
      return hasRole(this.userLogged, 'USER_CREATE_ALL');
    },
  },
  methods: {
    onCreate() {
      this.$emit('certification-creation');
    },
    onEdit(eventData) {
      this.$emit('certification-edition', eventData);
    },
  },
};
