import _ from 'lodash';
import { mapGetters } from 'vuex';
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
  computed: {
    ...mapGetters('app', ['userLogged']),
    sectionClass() {
      return { 'mt-0': this.$route.name === 'bill-preview' };
    },
  },
  methods: {
    buildBreadcrumbItems(to) {
      const items = [];
      if (to.path.match(/^\/bill\/?$/)) {
        items.push({ text: 'Bill Grid', route: { name: 'list-bill' }, active: true });
      } else {
        items.push({ text: 'Bill Grid', route: { name: 'list-bill' }, active: false });
        if (to.name === 'bill-edition') {
          items.push({ text: 'Bill Edition', route: { name: 'bill-edition' }, active: true });
        }
        if (to.name === 'bill-preview') {
          const entityId = _.get(this.$route, 'params.entityId', '');
          const params = { entityId };
          items.push({ text: 'Bill Detail', route: { name: 'bill-edition', params }, active: false });
          items.push({ text: 'Bill Preview', route: { name: 'bill-preview', params }, active: true });
        }
      }
      return items;
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'bill-edition',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
    onPreview(entityId) {
      this.$router.push({
        name: 'bill-preview',
        params: { entityId },
      });
    },
  },
};
