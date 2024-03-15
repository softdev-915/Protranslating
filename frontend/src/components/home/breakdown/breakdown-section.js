
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
      if (to.path === '/breakdown' || to.path === '/breakdown/') {
        items.push({ text: 'Breakdown Grid', route: { name: 'list-breakdown' }, active: true });
      } else {
        items.push({ text: 'Breakdown Grid', route: { name: 'list-breakdown' }, active: false });
        if (to.name === 'breakdown-edition') {
          items.push({ text: 'Breakdown Edition', route: { name: 'breakdown-edition' }, active: true });
        } else {
          items.push({ text: 'Breakdown Creation', route: { name: 'breakdown-creation' }, active: true });
        }
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'breakdown-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'breakdown-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
  },
};
