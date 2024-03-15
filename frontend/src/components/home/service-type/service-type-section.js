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
      switch (to.name) {
        case 'list-service-type':
          items.push({ text: 'Service Type Grid', route: { name: 'list-service-type' }, active: true });
          break;
        case 'service-type-edition':
          items.push({ text: 'Service Type Grid', route: { name: 'list-service-type' }, active: false });
          items.push({ text: 'Service Type Edition', active: true });
          break;
        case 'service-type-creation':
          items.push({ text: 'Service Type Grid', route: { name: 'list-service-type' }, active: false });
          items.push({ text: 'Service Type Creation', active: true });
          break;
        default:
          break;
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'service-type-creation' });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'service-type-edition',
        params: {
          entityId: eventData.item._id,
        },
      });
    },
  },
};
