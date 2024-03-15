import { mapGetters } from 'vuex';
import ActivityTagSection from './activity-tag-section.vue';
import SectionContainer from '../../../../section-container/section-container.vue';
import { hasRole } from '../../../../../utils/user';

const activityTagRelatedRoles = [
  'ACTIVITY-TAG_READ_ALL',
  'ACTIVITY-TAG_CREATE_ALL',
  'ACTIVITY-TAG_UPDATE_ALL',
];

export default {
  components: {
    ActivityTagSection,
    SectionContainer,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRead() {
      return activityTagRelatedRoles.some((r) => hasRole(this.userLogged, r));
    },
  },
};
