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
      if (to.path.replace(/^\/|\/$/g, '') === 'provider-instructions') {
        items.push({ text: 'Provider instructions Grid', route: { name: 'list-provider-instructions' }, active: true });
      } else {
        items.push({ text: 'Provider instructions Grid', route: { name: 'list-provider-instructions' }, active: false });
        if (to.name === 'provider-instructions-edition') {
          items.push({ text: 'Provider instructions Edition', route: { name: 'provider-instructions-edition' }, active: true });
        } else {
          items.push({ text: 'Provider instruction Creation', route: { name: 'provider-instructions-creation' }, active: true });
        }
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'provider-instructions-creation' });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'provider-instructions-edition',
        params: {
          entityId: eventData.item._id,
        },
      });
    },
  },
};
