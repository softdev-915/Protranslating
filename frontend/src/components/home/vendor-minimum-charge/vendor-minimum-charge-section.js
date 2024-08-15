
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
      if (to.path.match(/^\/vendor-minimum-charge\/?$/)) {
        items.push({ text: 'Vendor Minimum Charge Rates Grid', route: { name: 'list-vendor-minimum-charge' }, active: true });
      } else {
        items.push({ text: 'Vendor Minimum Charge Rates Grid', route: { name: 'list-vendor-minimum-charge' }, active: false });
        if (to.name === 'vendor-minimum-charge-edition') {
          items.push({ text: 'Vendor Minimum Charge Edition', route: { name: 'vendor-minimum-charge-edition' }, active: true });
        } else {
          items.push({ text: 'Vendor Minimum Charge Creation', route: { name: 'vendor-minimum-charge-creation' }, active: true });
        }
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'vendor-minimum-charge-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'vendor-minimum-charge-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
  },
};
