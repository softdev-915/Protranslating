import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import TranslationUnitService from '../../../services/translation-unit-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      translationUnitService: new TranslationUnitService(),
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'TRANSLATION-UNIT_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('translation-unit-creation');
    },
    onEdit(eventData) {
      this.$emit('translation-unit-edition', eventData);
    },
  },
};
