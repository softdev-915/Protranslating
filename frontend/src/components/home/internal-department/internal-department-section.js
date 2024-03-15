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
      if (to.path === '/internal-departments' || to.path === '/internal-departments/') {
        items.push({ text: 'LSP Internal departments Grid', route: { name: 'list-internal-department' }, active: true });
      } else {
        items.push({ text: 'LSP Internal departments Grid', route: { name: 'list-internal-department' }, active: false });
        if (to.name === 'internal-department-edition') {
          items.push({ text: 'Internal departments Edition', route: { name: 'internal-department-edition' }, active: true });
        } else {
          items.push({ text: 'Internal departments Creation', route: { name: 'internal-department-creation' }, active: true });
        }
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'internal-department-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'internal-department-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
  },
};
