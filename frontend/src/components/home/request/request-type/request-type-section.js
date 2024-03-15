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
      if (to.name === 'list-request-type') {
        items.push({ text: 'Request type Grid', route: { name: 'list-request-type' }, active: true });
      } else if (to.name === 'request-type-edition') {
        items.push({ text: 'Request type Grid', route: { name: 'list-request-type' }, active: false });
        items.push({ text: 'Edit Request Type', route: { name: 'request-type-edition' }, active: true });
      } else if (to.name === 'request-type-creation') {
        items.push({ text: 'Request type Grid', route: { name: 'list-request-type' }, active: false });
        items.push({ text: 'Create Request Type', route: { name: 'request-type-creation' }, active: true });
      }
      this.routerItems = items;
      return items;
    },
    onRequestTypeEdit(eventData) {
      this.$router.push({
        name: 'request-type-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
    onRequestTypeCreate() {
      this.$router.push({
        name: 'request-type-creation',
      }).catch((err) => { console.log(err); });
    },
  },
};
