import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../../utils/user';
import ServerPaginationGrid from '../../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import TaxFormService from '../../../../services/tax-form-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  data() {
    return {
      taxFormService: new TaxFormService(),
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'USER_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('tax-form-creation');
    },
    onEdit(eventData) {
      this.$emit('tax-form-edition', eventData);
    },
  },
};
