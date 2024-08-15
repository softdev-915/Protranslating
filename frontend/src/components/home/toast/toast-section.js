import SectionContainer from '../../section-container/section-container.vue';
import { sectionRouterMixin } from '../../../mixins/section-router';
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';

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
      if (to.name === 'list-toast') {
        items.push({ text: 'Header Notification Grid', route: { name: 'list-toast' }, active: true });
      } else if (to.name === 'toast-edition') {
        items.push({ text: 'Header Notification Grid', route: { name: 'list-toast' }, active: false });
        items.push({ text: 'Edit Header Notification', route: { name: 'toast-details' }, active: true });
      } else if (to.name === 'toast-creation') {
        items.push({ text: 'Header Notification Grid', route: { name: 'list-toast' }, active: false });
        items.push({ text: 'Create Header Notification', route: { name: 'toast-creation' }, active: true });
      }
      this.routerItems = items;
      return items;
    },
    onToastEdit(eventData) {
      this.$router.push({
        name: 'toast-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
    onToastCreate() {
      this.$router.push({
        name: 'toast-creation',
      }).catch((err) => { console.log(err); });
    },
  },
};
