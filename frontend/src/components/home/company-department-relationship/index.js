import { mapGetters } from 'vuex';
import CompanyDepartmentRelationshipSection from './company-department-relationship-section.vue';
import SectionContainer from '../../section-container/section-container.vue';
import { hasRole } from '../../../utils/user';

export default {
  components: {
    CompanyDepartmentRelationshipSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, 'COMPANY-DEPT-RELATIONSHIP_READ_ALL');
    },
  },
};
