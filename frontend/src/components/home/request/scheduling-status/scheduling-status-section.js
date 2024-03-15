import SectionContainer from '../../../section-container/section-container.vue';
import { sectionRouterMixin } from '../../../../mixins/section-router';
import UrlBasedBreadcrumb from '../../url-based-breadcrumb/url-based-breadcrumb.vue';

export default {
  mixins: [sectionRouterMixin],
  components: {
    UrlBasedBreadcrumb,
    SectionContainer,
  },
  data() {
    return {
      routerItems: [],
    };
  },
  methods: {
    buildBreadcrumbItems(to) {
      const items = [];
      if (to.name === 'list-scheduling-status') {
        items.push({ text: 'Scheduling Status Grid', route: { name: 'list-scheduling-status' }, active: true });
      } else if (to.name === 'scheduling-status-edition') {
        items.push({ text: 'Scheduling Status Grid', route: { name: 'list-scheduling-status' }, active: false });
        items.push({ text: 'Edit Scheduling Status', route: { name: 'scheduling-status-edition' }, active: true });
      } else if (to.name === 'scheduling-status-creation') {
        items.push({ text: 'Scheduling Status Grid', route: { name: 'list-scheduling-status' }, active: false });
        items.push({ text: 'Create Scheduling Status', route: { name: 'scheduling-status-creation' }, active: true });
      }
      this.routerItems = items;
      return items;
    },
    onSchedulingStatusEdit(eventData) {
      this.$router.push({
        name: 'scheduling-status-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
    onSchedulingStatusCreate() {
      this.$router.push({
        name: 'scheduling-status-creation',
      }).catch((err) => { console.log(err); });
    },
  },
};
