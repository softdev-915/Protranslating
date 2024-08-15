
import { sectionRouterMixin } from '../../../../mixins/section-router';
import UrlBasedBreadcrumb from '../../url-based-breadcrumb/url-based-breadcrumb.vue';

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
      if (to.path.match(/^\/software-requirements\/?$/)) {
        items.push({ text: 'Software Requirement Grid', route: { name: 'list-software-requirement' }, active: true });
      } else {
        items.push({ text: 'Software Requirement Grid', route: { name: 'list-software-requirement' }, active: false });
        if (to.name === 'software-requirement-edition') {
          items.push({ text: 'Software Requirement Edition', route: { name: 'software-requirement-edition' }, active: true });
        } else {
          items.push({ text: 'Software Requirement Creation', route: { name: 'software-requirement-creation' }, active: true });
        }
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'software-requirement-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'software-requirement-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
  },
};
