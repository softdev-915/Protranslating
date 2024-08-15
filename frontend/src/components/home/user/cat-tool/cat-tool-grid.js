import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../../utils/user';
import ServerPaginationGrid from '../../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import CatToolService from '../../../../services/cat-tool-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      catToolService: new CatToolService(),
    };
  },
  props: {
    query: {
      type: Object,
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'USER_CREATE_ALL') || hasRole(this.userLogged, 'CAT_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onEditInline(eventData) {
      this.$emit('cat-tool-edition', eventData);
    },
    onCreateInline() {
      this.$emit('cat-tool-creation');
    },
  },
};
