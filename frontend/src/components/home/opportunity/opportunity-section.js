
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
      if (to.path === '/opportunity' || to.path === '/opportunity/') {
        items.push({ text: 'Opportunities', route: { name: 'list-opportunity' }, active: true });
      } else {
        items.push({ text: 'Opportunities', route: { name: 'list-opportunity' }, active: false });
        if (to.name === 'opportunity-edition') {
          items.push({ text: 'Opportunity Detail', route: { name: 'opportunity-edition' }, active: true });
        } else {
          items.push({ text: 'New Opportunity', route: { name: 'opportunity-creation' }, active: true });
        }
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'opportunity-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'opportunity-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
  },
};
