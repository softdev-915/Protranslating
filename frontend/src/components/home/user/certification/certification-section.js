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
    onCreate() {
      this.$router.push({ name: 'certification-creation' }).catch((err) => { console.log(err); });
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'certification-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
    buildBreadcrumbItems(to) {
      const items = [];
      const routeBaseName = 'certifications';
      if (to.path === `/${routeBaseName}` || to.path === `/${routeBaseName}/`) {
        items.push({
          text: 'Certification Grid', route: { name: 'list-certification' }, ts: Date.now(), active: true,
        });
      } else {
        items.push({
          text: 'Certification Grid', route: { name: 'list-certification' }, ts: Date.now(), active: false,
        });
        if (to.path === `/${routeBaseName}/create`) {
          items.push({
            text: 'Certification Create', link: '#', ts: Date.now(), active: true,
          });
        } else if (to.path.indexOf('/details') !== -1) {
          items.push({
            text: 'Certification Edit', link: '#', ts: Date.now(), active: true,
          });
        }
      }
      this.routerItems = items;
      return items;
    },
  },
};
