
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
      if (to.path === '/currency' || to.path === '/currency/') {
        items.push({ text: 'Currencies Grid', route: { name: 'list-currency' }, active: true });
      } else {
        items.push({ text: 'Currencies Grid', route: { name: 'list-currency' }, active: false });
        if (to.name === 'currency-edition') {
          items.push({ text: 'Currencies Edition', route: { name: 'currency-edition' }, active: true });
        } else {
          items.push({ text: 'Currencies Creation', route: { name: 'currency-creation' }, active: true });
        }
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'currency-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'currency-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
  },
};
