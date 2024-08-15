import { sectionRouterMixin } from '../../../mixins/section-router';
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';

const BREADCRUM_ITEMS = {
  base: {
    text: 'AR Payment Grid',
    route: { name: 'payments' },
    active: false,
  },
  creation: {
    text: 'New AR Payment',
    route: { name: 'payment-creation' },
    active: true,
  },
  edition: {
    text: 'AR Payment Detail',
    route: { name: 'payment-edition' },
    active: true,
  },
};

export default {
  name: 'PaymentSection',
  mixins: [sectionRouterMixin],
  components: {
    UrlBasedBreadcrumb,
  },
  props: {
    canEdit: {
      type: Boolean,
      default: false,
    },
    canCreate: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    buildBreadcrumbItems(to) {
      const items = [BREADCRUM_ITEMS.base];
      switch (to.name) {
        case 'payments':
          BREADCRUM_ITEMS.base.active = true;
          break;
        case 'payment-creation':
          BREADCRUM_ITEMS.base.active = false;
          items.push(BREADCRUM_ITEMS.creation);
          break;
        case 'payment-detail':
          BREADCRUM_ITEMS.base.active = false;
          items.push(BREADCRUM_ITEMS.edition);
          break;
        default:
          break;
      }
      return items;
    },
  },
};
