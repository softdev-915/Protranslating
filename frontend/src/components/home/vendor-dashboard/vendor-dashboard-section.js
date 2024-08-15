/* global window */
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';
import VendorDashboard from './vendor-dashboard.vue';

export default {
  components: {
    UrlBasedBreadcrumb,
    VendorDashboard,
  },
  methods: {
    buildBreadcrumbItems(to) {
      const items = [];
      if (to.path.match(/^\/vendor-dashboard\/?$/)) {
        items.push({ text: 'Dashboard', route: { name: 'vendor-dashboard' }, active: true });
      }
      return items;
    },
  },
};
