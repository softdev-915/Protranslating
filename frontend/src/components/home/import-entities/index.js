import { mapGetters } from 'vuex';
import ImportEntitiesSection from './import-entities-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import userRoleCheckMixin from '../../../mixins/user-role-check';

export default {
  mixins: [userRoleCheckMixin],
  components: {
    ImportEntitiesSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return this.hasRole('ENTITIES-IMPORT_CREATE_ALL');
    },
  },
};
