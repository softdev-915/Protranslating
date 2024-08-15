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
      if (to.path === '/competence-levels' || to.path === '/competence-levels/') {
        items.push({ text: 'Competence Level Grid', route: { name: 'list-competence-levels' }, active: true });
      } else {
        items.push({ text: 'Competence Level Grid', route: { name: 'list-competence-levels' }, active: false });
        if (to.path === '/competence-levels/create') {
          items.push({ text: 'Competence Level Create', link: '#', active: true });
        } else if (to.path.indexOf('/details') !== -1) {
          items.push({ text: 'Competence Level Edit', link: '#', active: true });
        }
      }
      this.routerItems = items;
      return items;
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'competence-level-edition',
        params: { entityId: eventData.item._id },
      }).catch((err) => { console.log(err); });
    },
    onCreate() {
      this.$router.push({ name: 'competence-level-creation' }).catch((err) => { console.log(err); });
    },
    navigatePrevious() {
      if (this.routerItems.length > 1) {
        const { route } = this.routerItems[this.routerItems.length - 2];
        this.$router.push(route).catch((err) => { console.log(err); });
      }
    },
  },
};
