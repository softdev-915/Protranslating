import { sectionRouterMixin } from '../../../mixins/section-router';
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';

const BREADCRUM_ITEMS = {
  base: {
    text: 'Revenue Accounts Grid',
    route: { name: 'revenue-accounts' },
    active: false,
  },
  creation: {
    text: 'Revenue Account creation',
    route: { name: 'revenue-account-creation' },
    active: true,
  },
  edition: {
    text: 'Revenue Account edition',
    route: { name: 'revenue-account-edition' },
    active: true,
  },
};

export default {
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
        case 'revenue-accounts':
          BREADCRUM_ITEMS.base.active = true;
          break;
        case 'revenue-account-creation':
          BREADCRUM_ITEMS.base.active = false;
          items.push(BREADCRUM_ITEMS.creation);
          break;
        case 'revenue-account-edition':
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
