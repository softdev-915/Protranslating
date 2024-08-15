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
      if (to.path === '/abilities' || to.path === '/abilities/') {
        items.push({
          text: 'Ability Grid', route: { name: 'list-ability' }, ts: Date.now(), active: true,
        });
      } else {
        items.push({
          text: 'Ability Grid', route: { name: 'list-ability' }, ts: Date.now(), active: false,
        });
        if (to.path === '/abilities/create') {
          items.push({
            text: 'Ability Create', link: '#', ts: Date.now(), active: true,
          });
        } else if (to.path.indexOf('/details') !== -1) {
          items.push({
            text: 'Ability Edit', link: '#', ts: Date.now(), active: true,
          });
        }
      }
      this.routerItems = items;
      return items;
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'ability-edition',
        params: { entityId: eventData.item._id },
      }).catch((err) => { console.log(err); });
    },
    onCreate() {
      this.$router.push({ name: 'ability-create' }).catch((err) => { console.log(err); });
    },
  },
};
