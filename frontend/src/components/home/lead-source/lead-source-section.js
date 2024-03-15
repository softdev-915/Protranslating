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
      if (to.path === '/lead-source' || to.path === '/lead-source/') {
        items.push({ text: 'Lead Source Grid', route: { name: 'list-lead-source' }, active: true });
      } else {
        items.push({ text: 'Lead Source Grid', route: { name: 'list-lead-source' }, active: false });
        if (to.name === 'lead-source-edition') {
          items.push({ text: 'Lead Source Edition', route: { name: 'lead-source-edition' }, active: true });
        } else {
          items.push({ text: 'Lead Source Creation', route: { name: 'lead-source-creation' }, active: true });
        }
      }
      return items;
    },
    onManage() {
      this.$router.push({ name: 'lead-source-grid' }).catch((err) => { console.log(err); });
    },
    onCreate() {
      this.$router.push({ name: 'lead-source-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'lead-source-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
  },
};
