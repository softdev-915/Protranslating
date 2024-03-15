import { sectionRouterMixin } from '../../../mixins/section-router';
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';

export default {
  components: { UrlBasedBreadcrumb },
  mixins: [sectionRouterMixin],
  methods: {
    buildBreadcrumbItems() {
      return [{
        text: 'Compromised Password Grid',
        route: { name: 'list-compromised-password' },
        active: true,
      }];
    },
  },
};
