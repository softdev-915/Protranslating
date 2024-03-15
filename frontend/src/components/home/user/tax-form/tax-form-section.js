
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
      if (to.path.match(/^\/tax-forms\/?$/)) {
        items.push({ text: 'Tax Form Grid', route: { name: 'list-tax-form' }, active: true });
      } else {
        items.push({ text: 'Tax Form Grid', route: { name: 'list-tax-form' }, active: false });
        if (to.name === 'tax-form-edition') {
          items.push({ text: 'Tax Form Edition', route: { name: 'tax-form-edition' }, active: true });
        } else {
          items.push({ text: 'Tax Form Creation', route: { name: 'tax-form-creation' }, active: true });
        }
      }
      return items;
    },
    onCreate() {
      this.$router.push({ name: 'tax-form-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'tax-form-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
  },
};
