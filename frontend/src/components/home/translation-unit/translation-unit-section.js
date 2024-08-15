
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
      if (to.path === '/translation-unit' || to.path === '/translation-unit/') {
        items.push({ text: 'Units Grid', route: { name: 'list-translation-unit' }, active: true });
      } else {
        items.push({ text: 'Units Grid', route: { name: 'list-translation-unit' }, active: false });
        if (to.name === 'translation-unit-edition') {
          items.push({ text: 'Units Edition', route: { name: 'translation-unit-edition' }, active: true });
        } else {
          items.push({ text: 'Units Creation', route: { name: 'translation-unit-creation' }, active: true });
        }
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'translation-unit-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'translation-unit-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
  },
};
