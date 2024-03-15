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
        case 'list-delivery-type':
          items.push({ text: 'Delivery Type Grid', route: { name: 'list-delivery-type' }, active: true });
          break;
        case 'delivery-type-edition':
          items.push({ text: 'Delivery Type Grid', route: { name: 'list-delivery-type' }, active: false });
          items.push({ text: 'Delivery Type Edition', active: true });
          break;
        case 'delivery-type-creation':
          items.push({ text: 'Delivery Type Grid', route: { name: 'list-delivery-type' }, active: false });
          items.push({ text: 'Delivery Type Creation', active: true });
          break;
        default:
          break;
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'delivery-type-creation' });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'delivery-type-edition',
        params: {
          entityId: eventData.item._id,
        },
      });
    },
  },
};
