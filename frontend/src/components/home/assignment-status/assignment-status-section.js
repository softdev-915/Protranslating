
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
      if (to.path === '/assignment-status') {
        items.push({ text: 'Assignment status Grid', route: { name: 'assignment-status-list' }, active: true });
      } else {
        items.push({ text: 'Assignment status Grid', route: { name: 'assignment-status-list' }, active: false });
        if (to.name === 'assignment-status-edition') {
          items.push({ text: 'Assignment status Edition', route: { name: 'assignment-status-edition' }, active: true });
        } else {
          items.push({ text: 'Assignment status Creation', route: { name: 'assignment-status-creation' }, active: true });
        }
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'assignment-status-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'assignment-status-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
  },
};
