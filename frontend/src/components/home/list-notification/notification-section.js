import { hasRole } from '../../../utils/user';
import SectionContainer from '../../section-container/section-container.vue';
import NotificationGrid from './notification-grid.vue';
import NotificationDetail from './notification-detail.vue';
import NotificationAdvancedSettings from './notification-advanced-settings.vue';
import { sectionRouterMixin } from '../../../mixins/section-router';
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';

export default {
  mixins: [sectionRouterMixin],
  components: {
    UrlBasedBreadcrumb,
    SectionContainer,
    NotificationDetail,
    NotificationGrid,
    NotificationAdvancedSettings,
  },
  data() {
    return {
      currentComponent: null,
      currentValue: null,
      items: [{
        text: 'Home', link: '#', ts: Date.now(), active: true,
      }],
    };
  },
  canSetup() {
    return hasRole(this.userLogged, 'RESTORE_UPDATE_ALL');
  },
  methods: {
    buildBreadcrumbItems(to) {
      const items = [];
      items.push({
        text: 'Notifications Grid',
        route: { name: 'list-notification' },
        active: false,
      });
      if (to.path.match('advanced-settings')) {
        items.push({
          text: 'Advanced settings',
          route: {
            name: 'notification-advanced-settings',
          },
          active: true,
        });
      }
      if (to.path.match('details')) {
        items.push({
          text: 'Notification Detail',
          route: {
            name: 'notification-detail',
            params: to.params,
          },
          active: true,
        });
      }
      return items;
    },
    onShowNotificationDetail(eventData) {
      this.$router.push({
        name: 'notification-detail',
        params: {
          entityId: eventData.item._id,
          0: '',
        },
      }).catch((err) => { console.log(err); });
    },
    onShowNotificationAdvancedSettings() {
      this.$router.push({ name: 'notification-advanced-settings' }).catch((err) => { console.log(err); });
    },
  },
};
