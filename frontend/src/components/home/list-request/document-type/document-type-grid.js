import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../../utils/user';
import ServerPaginationGrid from '../../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import DocumentTypeService from '../../../../services/document-type-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  created() {
    this.documentTypeService = new DocumentTypeService();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'DOCUMENT-TYPE_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('document-type-creation');
    },
    onEdit(eventData) {
      this.$emit('document-type-edition', eventData);
    },
  },
};
