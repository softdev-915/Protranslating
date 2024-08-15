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
    onCreate() {
      this.$router.push({ name: 'location-creation' });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'location-edition',
        params: {
          entityId: eventData.item._id,
        },
      });
    },
    buildBreadcrumbItems(to) {
      const items = [];
      const routeBaseName = 'location';
      if (to.path === `/${routeBaseName}` || to.path === `/${routeBaseName}/`) {
        items.push({
          text: 'location Grid', route: { name: 'list-location' }, ts: Date.now(), active: true,
        });
      } else {
        items.push({
          text: 'location Grid', route: { name: 'list-location' }, ts: Date.now(), active: false,
        });
        if (to.path === `/${routeBaseName}/create`) {
          items.push({
            text: 'location Create', link: '#', ts: Date.now(), active: true,
          });
        } else if (to.path.indexOf('/details') !== -1) {
          items.push({
            text: 'location Edit', link: '#', ts: Date.now(), active: true,
          });
        }
      }
      this.routerItems = items;
      return items;
    },
  },
};
