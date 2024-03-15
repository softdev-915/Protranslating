import { sectionRouterMixin } from '../../../mixins/section-router';
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';

const BREADCRUM_ITEMS = {
  base: {
    text: 'AR Advances Grid',
    route: { name: 'advances' },
    active: false,
  },
  creation: {
    text: 'New AR Advance Payment',
    route: { name: 'advance-creation' },
    active: true,
  },
  edition: {
    text: 'AR Advance Detail',
    route: { name: 'advance-edition' },
    active: true,
  },
};

export default {
  name: 'AdvanceSection',
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
        case 'advances':
          BREADCRUM_ITEMS.base.active = true;
          break;
        case 'advance-creation':
          BREADCRUM_ITEMS.base.active = false;
          items.push(BREADCRUM_ITEMS.creation);
          break;
        case 'advance-edition':
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
