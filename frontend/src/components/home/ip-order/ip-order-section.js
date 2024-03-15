import { sectionRouterMixin } from '../../../mixins/section-router';
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';

const ORDER_CREATE_ROUTE_NAMES = [
  'ip-order-create-no-db',
  'ip-order-create-no-db-filing',
  'ip-order-epo-create',
  'ip-order-wipo-create',
];

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
      if (to.path === '/ip-order' || to.path === '/ip-order/') {
        items.push({ text: 'ORDER MENU', route: { name: 'ip-order-dashboard' }, active: true });
      } else {
        items.push({ text: 'ORDER MENU', route: { name: 'ip-order-dashboard' }, active: false });
        if (ORDER_CREATE_ROUTE_NAMES.some((routeName) => routeName === to.name)) {
          items.push({
            text: 'New IP Order',
            route: { name: 'ip-quote-create-no-db' },
            active: true,
          });
        }
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'ip-order-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'ip-order-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
  },
};
