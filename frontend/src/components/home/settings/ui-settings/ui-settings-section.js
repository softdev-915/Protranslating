import { sectionRouterMixin } from '../../../../mixins/section-router';
import UrlBasedBreadcrumb from '../../url-based-breadcrumb/url-based-breadcrumb.vue';
import UiSettingsEdit from './ui-settings-edit.vue';

export default {
  mixins: [sectionRouterMixin],
  components: {
    UrlBasedBreadcrumb,
    UiSettingsEdit,
  },
  data() {
    return {
      routerItems: [],
    };
  },
  methods: {
    buildBreadcrumbItems() {
      const items = [];
      items.push({
        text: 'UI Settings', link: '#', ts: Date.now(), active: true,
      });
      this.routerItems = items;
      return items;
    },
  },
};
