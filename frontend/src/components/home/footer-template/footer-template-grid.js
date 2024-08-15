import { mapActions, mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import FooterTemplateService from '../../../services/footer-template-service';

export default {
  components: {
    ServerPaginationGrid,
  },
  created() {
    this.footerTemplateService = new FooterTemplateService();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate: function () {
      return hasRole(this.userLogged, 'FOOTER-TEMPLATE_CREATE_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCreateNew() {
      this.$emit('footer-template-creation');
    },
    onEdit(eventData) {
      this.$emit('footer-template-edition', eventData);
    },
  },
};
