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
      if (to.name === 'list-template') {
        items.push({ text: 'Templates Grid', route: { name: 'list-template' }, active: true });
      } else {
        items.push({ text: 'Templates Grid', route: { name: 'list-template' }, active: false });
        if (to.name === 'template-creation') {
          items.push({ text: 'Templates Creation', route: { name: 'template-creation' }, active: true });
        } else {
          items.push({
            text: 'Templates Edition',
            route: {
              name: 'template-edition',
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
      this.$router.push({ name: 'template-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'template-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
  },
};

