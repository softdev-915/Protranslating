import { mapGetters } from 'vuex';
import LocationService from '../../../services/location-service';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      service: new LocationService(),
    };
  },
  props: {
    query: Object,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate() {
      return hasRole(this.userLogged, 'LOCATION_CREATE_ALL');
    },
  },
  methods: {
    onCreate() {
      this.$emit('location-creation');
    },
    onEdit(eventData) {
      this.$emit('location-edition', eventData);
    },
  },
};
