
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
      if (to.path === '/payment-methods' || to.path === '/payment-methods/') {
        items.push({ text: 'Payment methods Grid', route: { name: 'list-payment-method' }, active: true });
      } else {
        items.push({ text: 'Payment methods Grid', route: { name: 'list-payment-method' }, active: false });
        if (to.name === 'payment-method-edition') {
          items.push({ text: 'Payment methods Edition', route: { name: 'payment-method-edition' }, active: true });
        } else {
          items.push({ text: 'Payment methods Creation', route: { name: 'payment-method-creation' }, active: true });
        }
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'payment-method-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'payment-method-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
  },
};
