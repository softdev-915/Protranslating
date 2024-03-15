
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
      if (to.path === '/billing-terms' || to.path === '/billing-terms/') {
        items.push({ text: 'Billing terms Grid', route: { name: 'list-billing-term' }, active: true });
      } else {
        items.push({ text: 'Billing terms Grid', route: { name: 'list-billing-term' }, active: false });
        if (to.name === 'billing-term-edition') {
          items.push({ text: 'Billing terms Edition', route: { name: 'billing-term-edition' }, active: true });
        } else {
          items.push({ text: 'Billing terms Creation', route: { name: 'billing-term-creation' }, active: true });
        }
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'billing-term-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'billing-term-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
  },
};
