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
    onEdit(eventData) {
      this.$router.push({
        name: 'connector-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
    buildBreadcrumbItems(to) {
      const items = [];
      const routeBaseName = 'connector';
      if (to.path === `/${routeBaseName}` || to.path === `/${routeBaseName}/`) {
        items.push({
          text: 'Connector Grid', route: { name: 'list-connector' }, ts: Date.now(), active: true,
        });
      } else {
        items.push({
          text: 'Connector Grid', route: { name: 'list-connector' }, ts: Date.now(), active: false,
        });
        if (to.path.indexOf('/details') !== -1) {
          items.push({
            text: 'Connector Edit', link: '#', ts: Date.now(), active: true,
          });
        }
      }
      this.routerItems = items;
      return items;
    },
  },
};
