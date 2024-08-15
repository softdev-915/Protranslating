import { mapGetters } from 'vuex';
import DocumentTypeSection from './document-type-section.vue';
import SectionContainer from '../../../section-container/section-container.vue';
import { hasRole } from '../../../../utils/user';

export default {
  components: {
    DocumentTypeSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return hasRole(this.userLogged, {
        oneOf: ['DOCUMENT-TYPE_READ_ALL', 'DOCUMENT-TYPE_CREATE_ALL', 'DOCUMENT-TYPE_UPDATE_ALL'],
      });
    },
  },
};
