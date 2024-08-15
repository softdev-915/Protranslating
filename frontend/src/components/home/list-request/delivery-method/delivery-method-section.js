import { sectionRouterMixin } from '../../../../mixins/section-router';
import UrlBasedBreadcrumb from '../../url-based-breadcrumb/url-based-breadcrumb.vue';

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
      if (to.path.match(/^\/delivery-methods\/?$/)) {
        items.push({ text: 'Delivery Method Grid', route: { name: 'list-delivery-method' }, active: true });
      } else {
        items.push({ text: 'Delivery Method Grid', route: { name: 'list-delivery-method' }, active: false });
        if (to.name === 'delivery-method-edition') {
          items.push({ text: 'Delivery Method Edition', route: { name: 'delivery-method-edition' }, active: true });
        } else {
          items.push({ text: 'Delivery Method Creation', route: { name: 'delivery-method-creation' }, active: true });
        }
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'delivery-method-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'delivery-method-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
  },
};
