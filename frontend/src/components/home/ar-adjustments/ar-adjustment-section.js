import { sectionRouterMixin } from '../../../mixins/section-router';
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';

const BREADCRUM_ITEMS = {
  base: {
    text: 'AR Adjustments Grid',
    route: { name: 'adjustments' },
    active: false,
  },
  creation: {
    text: 'New AR Adjustment',
    route: { name: 'adjustment-creation' },
    active: true,
  },
  edition: {
    text: 'AR Adjustment Detail',
    route: { name: 'adjustment-detail' },
    active: true,
  },
};

export default {
  name: 'AdjustmentSection',
  mixins: [sectionRouterMixin],
  components: {
    UrlBasedBreadcrumb,
  },
  props: {
    canCreate: {
      type: Boolean,
      default: false,
    },
    canEdit: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    buildBreadcrumbItems(to) {
      const items = [BREADCRUM_ITEMS.base];
      switch (to.name) {
        case 'adjustments':
          BREADCRUM_ITEMS.base.active = true;
          break;
        case 'adjustment-detail':
          BREADCRUM_ITEMS.base.active = false;
          items.push(BREADCRUM_ITEMS.edition);
          break;
        case 'adjustment-creation':
          BREADCRUM_ITEMS.base.active = false;
          items.push(BREADCRUM_ITEMS.creation);
          break;
        default:
          break;
      }
      return items;
    },
  },
};
