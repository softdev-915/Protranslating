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
      if (to.path.match(/^\/mt-model\/?$/)) {
        items.push({ text: 'MT Models Grid', route: { name: 'list-mt-model' }, active: true });
      } else {
        items.push({ text: 'MT Models Grid', route: { name: 'list-mt-model' }, active: false });
        if (to.name === 'mt-model-edition') {
          items.push({ text: 'MT Models Edition', route: { name: 'mt-model-edition' }, active: true });
        } else {
          items.push({ text: 'MT Models Creation', route: { name: 'mt-model-creation' }, active: true });
        }
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'mt-model-creation' });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'mt-model-edition',
        params: {
          entityId: eventData.item._id,
        },
      });
    },
  },
};
