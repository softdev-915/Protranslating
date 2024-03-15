import { mapGetters } from 'vuex';
import ActivitySection from './activity-section.vue';
import SectionContainer from '../../../section-container/section-container.vue';
import { hasRole } from '../../../../utils/user';

const activityRelatedRoles = [
  'ACTIVITY-NC-CC_CREATE_ALL',
  'ACTIVITY-NC-CC_READ_ALL',
  'ACTIVITY-NC-CC_UPDATE_ALL',
  'ACTIVITY-NC-CC_CREATE_OWN',
  'ACTIVITY-NC-CC_READ_OWN',
  'ACTIVITY-NC-CC_UPDATE_OWN',
  'ACTIVITY-VES1_READ_ALL',
  'ACTIVITY-VES1_CREATE_ALL',
  'ACTIVITY-VES1_UPDATE_ALL',
  'ACTIVITY-VES2_READ_ALL',
  'ACTIVITY-VES2_CREATE_ALL',
  'ACTIVITY-VES2_UPDATE_ALL',
  'ACTIVITY-VES-T_READ_ALL',
  'ACTIVITY-VES-T_CREATE_ALL',
  'ACTIVITY-VES-T_UPDATE_ALL',
  'ACTIVITY-VES-B_READ_ALL',
  'ACTIVITY-VES-B_CREATE_ALL',
  'ACTIVITY-VES-B_UPDATE_ALL',
  'ACTIVITY-CA_READ_ALL',
  'ACTIVITY-CA_CREATE_ALL',
  'ACTIVITY-CA_UPDATE_ALL',
  'ACTIVITY-FR_READ_ALL',
  'ACTIVITY-FR_CREATE_ALL',
  'ACTIVITY-FR_UPDATE_ALL',
  'ACTIVITY-NC-CC_READ_DEPARTMENT',
  'ACTIVITY-NC-CC_CREATE_DEPARTMENT',
  'ACTIVITY-NC-CC_UPDATE_DEPARTMENT',
  'ACTIVITY-EMAIL_READ_ALL',
  'ACTIVITY-EMAIL_READ_OWN',
  'ACTIVITY-USER-NOTE_READ_ALL',
];

export default {
  components: {
    ActivitySection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return activityRelatedRoles.some((r) => hasRole(this.userLogged, r));
    },
  },
};
