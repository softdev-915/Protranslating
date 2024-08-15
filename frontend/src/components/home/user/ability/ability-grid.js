import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../../utils/user';
import ServerPaginationGrid from '../../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import AbilityService from '../../../../services/ability-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      abilityService: new AbilityService(),
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
      return hasRole(this.userLogged, 'USER_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onEditInline(eventData) {
      this.$emit('ability-edition', eventData);
    },
    onCreateInline() {
      this.$emit('ability-creation');
    },
  },
};
