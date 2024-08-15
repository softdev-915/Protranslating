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
        case 'provider-pooling-offers':
          items.push({ text: 'Provider Pooling Offers', route: { name: 'provider-pooling-offers' }, active: true });
          break;
        case 'provider-pooling-offer-details':
          items.push({ text: 'Provider Pooling Offers', route: { name: 'provider-pooling-offers' }, active: false });
          items.push({ text: 'Edit Provider Pooling Offer', active: true });
          break;
        default:
          break;
      }
      return items;
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'provider-pooling-offer-details',
        params: {
          entityId: eventData.item._id,
        },
      });
    },
  },
};
