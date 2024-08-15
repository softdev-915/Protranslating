import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../../utils/user';
import ServerPaginationGrid from '../../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import CompetenceLevelService from '../../../../services/competence-level-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      competenceLevelService: new CompetenceLevelService(),
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
      this.$emit('competence-level-edition', eventData);
    },
    onCreateInline() {
      this.$emit('competence-level-creation');
    },
  },
};
