/* global window */
import { sectionRouterMixin } from '../../../mixins/section-router';
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';

export default {
  mixins: [sectionRouterMixin],
  components: {
    UrlBasedBreadcrumb,
  },
  data() {
    return {
      routerItems: [],
    };
  },
  methods: {
    buildBreadcrumbItems(to) {
      const items = [];
      if (to.path === '/ip-instructions-deadlines' || to.path === '/ip-instructions-deadlines/') {
        items.push({ text: 'Ip Instructions Deadlines Grid', route: { name: 'list-ip-instructions-deadline' }, active: true });
      } else {
        items.push({ text: 'Ip Instructions Deadlines Grid', route: { name: 'list-ip-instructions-deadline' }, active: false });
        if (to.name === 'ip-instructions-deadline-edition') {
          items.push({ text: 'Ip Instructions Deadlines Edition', route: { name: 'ip-instructions-deadline-edition' }, active: true });
        } else {
          items.push({ text: 'Ip Instructions Deadlines Creation', route: { name: 'ip-instructions-deadline-creation' }, active: true });
        }
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'ip-instructions-deadline-creation' });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'ip-instructions-deadline-edition',
        params: {
          entityId: eventData.item._id,
        },
      });
    },
  },
};
