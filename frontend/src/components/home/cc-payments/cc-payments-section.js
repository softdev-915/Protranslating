import { sectionRouterMixin } from '../../../mixins/section-router';
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';

const BREADCRUM_ITEMS = {
  base: {
    text: 'Credit Card Payments Grid',
    route: { name: 'cc-payments' },
    active: false,
  },
  detail: {
    text: 'Credit Card Payment Detail',
    route: { name: 'cc-payment-detail' },
    active: true,
  },
};

export default {
  name: 'CcPaymentsSection',
  mixins: [sectionRouterMixin],
  components: {
    UrlBasedBreadcrumb,
  },
  methods: {
    buildBreadcrumbItems(to) {
      const items = [BREADCRUM_ITEMS.base];
      switch (to.name) {
        case 'cc-payments':
          BREADCRUM_ITEMS.base.active = true;
          break;
        case 'cc-payment-detail':
          BREADCRUM_ITEMS.base.active = false;
          items.push(BREADCRUM_ITEMS.detail);
          break;
        default:
          break;
      }
      return items;
    },
  },
};
