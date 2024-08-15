import { mapGetters } from 'vuex';
import ServerPaginationGrid from '../../../responsive-grid/server-pagination-grid/server-pagination-grid.vue';
import LanguageService from '../../../../services/language-service';
import userRoleCheckMixin from '../../../../mixins/user-role-check';

export default {
  mixins: [userRoleCheckMixin],
  components: {
    ServerPaginationGrid,
  },
  props: {
    query: {
      type: Object,
    },
  },
  created() {
    this.languageService = new LanguageService();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate() {
      return this.hasRole('LANGUAGE_CREATE_ALL');
    },
  },
  methods: {
    onEdit(eventData) {
      this.$emit('language-edition', eventData);
    },
    onCreateInline() {
      this.$emit('language-creation');
    },
  },
};
