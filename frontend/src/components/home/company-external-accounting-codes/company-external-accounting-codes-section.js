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
      if (to.path.match(/^\/company-external-accounting-codes\/?$/)) {
        items.push({ text: 'Company External Accounting Codes Grid', route: { name: 'list-company-external-accounting-codes' }, active: true });
      } else {
        items.push({ text: 'Company External Accounting Codes Grid', route: { name: 'list-company-external-accounting-codes' }, active: false });
        if (to.name === 'company-external-accounting-codes-edition') {
          items.push({ text: 'Company External Accounting Codes Edition', route: { name: 'company-external-accounting-codes-edition' }, active: true });
        } else {
          items.push({ text: 'Company External Accounting Codes Creation', route: { name: 'company-external-accounting-codes-creation' }, active: true });
        }
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'company-external-accounting-codes-creation' });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'company-external-accounting-codes-edition',
        params: {
          entityId: eventData.item._id,
        },
      });
    },
  },
};
