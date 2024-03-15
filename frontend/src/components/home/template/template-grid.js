import { mapGetters } from 'vuex';
import ServerPaginationGrid from '../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import TemplateService from '../../../services/template-service';

import { hasRole } from '../../../utils/user';

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
      templateService: new TemplateService(),
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate() {
      return ['TEMPLATE_CREATE_ALL', 'TEMPLATE_UPDATE_ALL'].some((role) => hasRole(this.userLogged, role));
    },
  },
  methods: {
    onEdit(eventData) {
      this.$emit('template-edition', eventData);
    },
    onCreate() {
      this.$emit('template-creation');
    },
  },
};
