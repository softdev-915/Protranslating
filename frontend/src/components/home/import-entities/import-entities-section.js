/* global window */
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';
import ImportEntities from './import-entities.vue';

export default {
  components: {
    UrlBasedBreadcrumb,
    ImportEntities,
  },
  methods: {
    buildBreadcrumbItems(to) {
      const items = [];
      if (to.path.match(/^\/import-entities\/?$/)) {
        items.push({ text: 'Import entities', route: { name: 'import-entities' }, active: true });
      }
      return items;
    },
  },
};
