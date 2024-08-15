import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';

export default {
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
      if (to.path.match(/^\/ap-print-checks\/?$/)) {
        items.push({ text: 'AP Print Checks', route: { name: 'ap-print-checks' }, active: true });
      }
      return items;
    },
  },
};
