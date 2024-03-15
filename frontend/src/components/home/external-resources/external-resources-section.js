import ExternalResources from './external-resources.vue';
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';

const BREADCRUM_ITEMS = () => [{ text: 'External resources', route: { name: 'external-resource' }, active: true }];

export default {
  components: {
    ExternalResources,
    UrlBasedBreadcrumb,
  },
  computed: {
    breadcrumItems() {
      return BREADCRUM_ITEMS;
    },
  },
};
