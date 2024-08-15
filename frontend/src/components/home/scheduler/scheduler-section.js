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
      if (to.name === 'list-scheduler') {
        items.push({ text: 'Scheduler Grid', route: { name: 'list-scheduler' }, active: true });
      } else {
        items.push({ text: 'Scheduler Grid', route: { name: 'list-scheduler' }, active: false });
        if (to.name === 'scheduler-creation') {
          items.push({ text: 'Scheduler Creation', route: { name: 'scheduler-creation' }, active: true });
        } else {
          items.push({
            text: 'Scheduler Creation',
            route: {
              name: 'scheduler-creation',
              params: to.params,
            },
            active: true,
          });
        }
      }
      this.routerItems = items;
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'scheduler-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'scheduler-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
  },
};

