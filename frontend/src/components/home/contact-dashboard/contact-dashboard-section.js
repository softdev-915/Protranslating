/* global window */
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';
import ContactDashboard from './contact-dashboard.vue';

export default {
  components: {
    UrlBasedBreadcrumb,
    ContactDashboard,
  },
  methods: {
    buildBreadcrumbItems(to) {
      const items = [];
      if (to.path.match(/^\/contact-dashboard\/?$/)) {
        items.push({ text: 'Dashboard', route: { name: 'contact-dashboard' }, active: true });
      }
      return items;
    },
  },
};
