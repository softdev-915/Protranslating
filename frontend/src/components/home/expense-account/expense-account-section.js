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
      if (to.path.match(/^\/expense-account\/?$/)) {
        items.push({ text: 'Expense Account Grid', route: { name: 'list-expense-account' }, active: true });
      } else {
        items.push({ text: 'Expense Account Grid', route: { name: 'list-expense-account' }, active: false });
        if (to.name === 'expense-account-edition') {
          items.push({ text: 'Expense Account Edition', route: { name: 'expense-account-edition' }, active: true });
        } else {
          items.push({ text: 'Expense Account Creation', route: { name: 'expense-account-creation' }, active: true });
        }
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'expense-account-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'expense-account-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
  },
};
