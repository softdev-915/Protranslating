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
        case 'list-footer-template':
          items.push({ text: 'Footer Template Grid', route: { name: 'list-footer-template' }, active: true });
          break;
        case 'footer-template-edition':
          items.push({ text: 'Footer Template Grid', route: { name: 'list-footer-template' }, active: false });
          items.push({ text: 'Footer Template Edition', active: true });
          break;
        case 'footer-template-creation':
          items.push({ text: 'Footer Template Grid', route: { name: 'list-footer-template' }, active: false });
          items.push({ text: 'Footer Template Creation', active: true });
          break;
        default:
          break;
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'footer-template-creation' });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'footer-template-edition',
        params: {
          entityId: eventData.item._id,
        },
      });
    },
  },
};
