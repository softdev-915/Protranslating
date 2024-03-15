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
      if (to.path.match(/^\/document-types\/?$/)) {
        items.push({ text: 'Document Type Grid', route: { name: 'list-document-type' }, active: true });
      } else {
        items.push({ text: 'Document Type Grid', route: { name: 'list-document-type' }, active: false });
        if (to.name === 'document-type-edition') {
          items.push({ text: 'Document Type Edition', route: { name: 'document-type-edition' }, active: true });
        } else {
          items.push({ text: 'Document Type Creation', route: { name: 'document-type-creation' }, active: true });
        }
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'document-type-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'document-type-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
  },
};
