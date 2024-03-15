import { sectionRouterMixin } from '../../../../mixins/section-router';
import SectionContainer from '../../../section-container/section-container.vue';
import UrlBasedBreadcrumb from '../../url-based-breadcrumb/url-based-breadcrumb.vue';

const BREADCRUMB_ITEMS = {
  ACTIVE_GRID: {
    text: 'Language Grid', route: { name: 'list-language' }, ts: Date.now(), active: true,
  },
  INACTIVE_GRID: {
    text: 'Language Grid', route: { name: 'list-language' }, ts: Date.now(), active: false,
  },
  CREATE: {
    text: 'Language Create', link: '#', ts: Date.now(), active: true,
  },
  EDIT: {
    text: 'Language Edit', link: '#', ts: Date.now(), active: true,
  },
};

export default {
  mixins: [sectionRouterMixin],
  components: {
    UrlBasedBreadcrumb,
    SectionContainer,
  },
  methods: {
    buildBreadcrumbItems(to) {
      const items = [];
      const isCreateRoute = to.path.indexOf('/languages/create') >= 0;
      const isEditRoute = to.path.indexOf('/details') >= 0;
      if (isCreateRoute || isEditRoute) {
        items.push(BREADCRUMB_ITEMS.INACTIVE_GRID);
        if (isCreateRoute) {
          items.push(BREADCRUMB_ITEMS.CREATE);
        } else {
          items.push(BREADCRUMB_ITEMS.EDIT);
        }
      } else {
        items.push(BREADCRUMB_ITEMS.ACTIVE_GRID);
      }
      return items;
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'language-edition',
        params: { entityId: eventData.item._id },
      }).catch((err) => { console.log(err); });
    },
    onCreate() {
      this.$router.push({ name: 'language-create' }).catch((err) => { console.log(err); });
    },
  },
};
