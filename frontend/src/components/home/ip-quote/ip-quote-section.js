import _ from 'lodash';
import { sectionRouterMixin } from '../../../mixins/section-router';
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';

const EDIT_REGEXP = /^ip-quote-(wipo|epo|no-db|no-db-filing)-edit$/;
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
      if (to.path === '/ip-quote') {
        items.push({
          text: 'Quote Menu',
          route: { name: 'ip-quote-dashboard' },
          active: true,
        });
      } else if (EDIT_REGEXP.test(to.name)) {
        items.push({
          text: 'Quotes',
          link: 'quote-list',
          active: false,
          route: { name: 'quote-list' },
        }, {
          text: 'Quote edition',
          route: {
            name: 'quote-edition',
            params: { requestId: _.get(to, 'params.entityId', '') },
          },
          active: false,
        }, {
          text: 'IP quote edition',
          route: { name: to.name },
          active: true,
        });
      } else {
        items.push({
          text: 'Quote Menu',
          route: { name: 'ip-quote-dashboard' },
          active: false,
        });
        if (to.name === 'ip-quote-epo-create') {
          items.push({
            text: 'New IP Quote',
            route: { name: 'ip-quote-epo-create' },
            active: true,
          });
        } else if (
          to.name === 'ip-quote-create-no-db'
        ) {
          items.push({
            text: 'New IP Quote',
            route: { name: 'ip-quote-create-no-db' },
            active: true,
          });
        } else if (to.name === 'ip-quote-create-no-db-filing') {
          items.push({
            text: 'New IP Quote',
            route: { name: 'ip-quote-create-no-db-filing' },
            active: true,
          });
        } else if (to.name === 'ip-quote-create') {
          items.push({
            text: 'New IP Quote',
            route: { name: 'ip-quote-create' },
            active: true,
          });
        } else if (to.name === 'create-quote') {
          items.push({
            text: 'New Quote',
            route: { name: 'create-quote' },
            active: true,
          });
        }
      }
      return items;
    },
  },
};
