import { sectionRouterMixin } from '../../../mixins/section-router';
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';

export default {
  components: { UrlBasedBreadcrumb },
  mixins: [sectionRouterMixin],
  created() {
    this.customQueryGrid = {
      text: 'Custom Query Grid',
      route: { name: 'list-custom-query' },
    };
    this.customQueryCreation = {
      text: 'Custom Query Creation',
      route: { name: 'custom-query-creation' },
    };
    this.customQueryEdition = {
      text: 'Custom Query Edition',
      route: { name: 'custom-query-edition' },
    };
  },
  methods: {
    buildBreadcrumbItems(to) {
      const items = [];
      if (to.name === this.customQueryGrid.route.name) {
        items.push({ ...this.customQueryGrid, active: true });
      } else {
        items.push({ ...this.customQueryGrid, active: false });
        if (to.name === this.customQueryCreation.route.name) {
          items.push({ ...this.customQueryCreation, active: true });
        } else {
          items.push({ ...this.customQueryEdition, active: true });
        }
      }
      return items;
    },
    onCustomQueryCreation() {
      this.$router.push({ name: this.customQueryCreation.route.name }).catch((err) => { console.log(err); });
    },
    onCustomQueryEdition(event) {
      this.$router.push({
        name: this.customQueryEdition.route.name,
        params: { entityId: event.item._id },
      }).catch((err) => { console.log(err); });
    },
  },
};
