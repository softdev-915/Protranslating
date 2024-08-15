
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
      if (to.path.match(/^\/ability-expense-account\/?$/)) {
        items.push({ text: 'Ability Expense Account Grid', route: { name: 'list-ability-expense-account' }, active: true });
      } else {
        items.push({ text: 'Ability Expense Account Grid', route: { name: 'list-ability-expense-account' }, active: false });
        if (to.name === 'ability-expense-account-edition') {
          items.push({ text: 'Ability Expense Account Edition', route: { name: 'ability-expense-account-edition' }, active: true });
        } else {
          items.push({ text: 'Ability Expense Account Creation', route: { name: 'ability-expense-account-creation' }, active: true });
        }
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'ability-expense-account-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'ability-expense-account-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
  },
};
