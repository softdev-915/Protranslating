import { sectionRouterMixin } from '../../../mixins/section-router';
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';

const GRID_ROUTE_NAME = 'list-company-minimum-charge';

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
      if (this.$route.name === GRID_ROUTE_NAME) {
        this.$router.push({ name: 'company-minimum-charge-creation' }).catch((err) => { console.log(err); });
      } else {
        this.$emit('company-minimum-charge-creation');
      }
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'company-minimum-charge-edition',
        params: {
          entityId: eventData.item._id,
        },
      });
    },
    onCreateClone() {
      this.$router.push(
        this.$route.path.replace(/company-minimum-charge.*/, 'company-minimum-charge/create'),
      );
    },
    buildBreadcrumbItems(to) {
      const items = [];
      const routeBaseName = 'company-minimum-charge';
      if (to.path === `/${routeBaseName}` || to.path === `/${routeBaseName}/`) {
        items.push({
          text: 'Company minimum charge Grid', route: { name: 'list-company-minimum-charge' }, ts: Date.now(), active: true,
        });
      } else {
        items.push({
          text: 'Company minimum charge Grid', route: { name: 'list-company-minimum-charge' }, ts: Date.now(), active: false,
        });
        if (to.path === `/${routeBaseName}/create`) {
          items.push({
            text: 'New Minimum Charge', link: '#', ts: Date.now(), active: true,
          });
        } else if (to.path.indexOf('/details') !== -1) {
          items.push({
            text: 'Company minimum charge Edit', link: '#', ts: Date.now(), active: true,
          });
        }
      }
      this.routerItems = items;
      return items;
    },
  },
};
