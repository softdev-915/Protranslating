import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../../utils/user';
import ServerPaginationGrid from '../../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import RequestTypeService from '../../../../services/request-type-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  props: {
    query: {
      type: Object,
    },
  },
  data() {
    return {
      requestTypeService: new RequestTypeService(),
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'REQUEST_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onEdit(event) {
      this.$emit('request-type-edit', event);
    },
    onCreate(event) {
      this.$emit('request-type-create', event);
    },
  },
};
