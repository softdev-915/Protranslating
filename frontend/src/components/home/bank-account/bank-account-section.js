import { sectionRouterMixin } from '../../../mixins/section-router';
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';

const BREADCRUMB_ITEMS = {
  base: {
    text: 'Bank Account Grid',
    route: { name: 'bank-accounts' },
    active: false,
  },
  creation: {
    text: 'Bank account creation',
    route: { name: 'bank-account-creation' },
    active: true,
  },
  edition: {
    text: 'Bank account edition',
    route: { name: 'bank-account-edition' },
    active: true,
  },
};

export default {
  mixins: [sectionRouterMixin],
  components: { UrlBasedBreadcrumb },
  props: {
    canEdit: { type: Boolean, default: false },
    canCreate: { type: Boolean, default: false },
  },
  methods: {
    buildBreadcrumbItems(to) {
      const items = [BREADCRUMB_ITEMS.base];
      switch (to.name) {
        case 'bank-accounts':
          BREADCRUMB_ITEMS.base.active = true;
          break;
        case 'bank-account-creation':
          BREADCRUMB_ITEMS.base.active = false;
          items.push(BREADCRUMB_ITEMS.creation);
          break;
        case 'bank-account-edition':
          BREADCRUMB_ITEMS.base.active = false;
          items.push(BREADCRUMB_ITEMS.edition);
          break;
        default:
          break;
      }
      return items;
    },
  },
};
