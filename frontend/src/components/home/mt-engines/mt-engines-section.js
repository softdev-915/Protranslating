import _ from 'lodash';
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
      if (to.path === '/mt-engines' || to.path === '/mt-engines/') {
        items.push({ text: 'MT engines Grid', route: { name: 'list-mt-engine' }, active: true });
      } else {
        items.push({ text: 'MT engines Grid', route: { name: 'list-mt-engine' }, active: false });
        if (to.name === 'mt-engine-edition') {
          items.push({ text: 'MT engines Edition', route: { name: 'mt-engine-edition' }, active: true });
        } else {
          items.push({ text: 'MT engines Creation', route: { name: 'mt-engine-creation' }, active: true });
        }
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'mt-engine-creation' });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'mt-engine-edition',
        params: {
          entityId: _.get(eventData, 'item._id'),
        },
      });
    },
  },
};
