
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
      if (to.path.match(/^\/company-department-relationship\/?$/)) {
        items.push({ text: 'Company Department Relationship Grid', route: { name: 'list-company-department-relationship' }, active: true });
      } else {
        items.push({ text: 'Company Department Relationship Grid', route: { name: 'list-company-department-relationship' }, active: false });
        if (to.name === 'company-department-relationship-edition') {
          items.push({ text: 'Company Department Relationship Edition', route: { name: 'company-department-relationship-edition' }, active: true });
        } else {
          items.push({ text: 'Company Department Relationship Creation', route: { name: 'company-department-relationship-creation' }, active: true });
        }
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'company-department-relationship-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'company-department-relationship-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
  },
};
