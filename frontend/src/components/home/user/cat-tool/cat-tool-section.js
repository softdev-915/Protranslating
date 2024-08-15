import { sectionRouterMixin } from '../../../../mixins/section-router';
import SectionContainer from '../../../section-container/section-container.vue';
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
      if (to.path === '/cat-tools' || to.path === '/cat-tools/') {
        items.push({ text: 'Translation Tools Grid', route: { name: 'list-cat-tools' }, active: true });
      } else {
        items.push({ text: 'Translation Tools Grid', route: { name: 'list-cat-tools' }, active: false });
        if (to.path === '/cat-tools/create') {
          items.push({ text: 'Translation Tools Create', link: '#', active: true });
        } else if (to.path.indexOf('/details') !== -1) {
          items.push({ text: 'Translation Tools Edit', link: '#', active: true });
        }
      }
      this.routerItems = items;
      return items;
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'cat-tool-edition',
        params: { entityId: eventData.item._id },
      }).catch((err) => { console.log(err); });
    },
    onCreate() {
      this.$router.push({ name: 'cat-tool-creation' }).catch((err) => { console.log(err); });
    },
    navigatePrevious() {
      if (this.routerItems.length > 1) {
        const { route } = this.routerItems[this.routerItems.length - 2];
        this.$router.push(route).catch((err) => { console.log(err); });
      }
    },
  },
};
