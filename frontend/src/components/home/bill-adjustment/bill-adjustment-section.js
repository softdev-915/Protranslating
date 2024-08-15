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
  },
  methods: {
    buildBreadcrumbItems(to) {
      const items = [];
      if (to.path.match(/^\/bill-adjustment\/?$/)) {
        items.push({ text: 'AP Adjustments Grid', route: { name: 'list-bill-adjustment' }, active: true });
      } else {
        items.push({ text: 'AP Adjustments Grid', route: { name: 'list-bill-adjustment' }, active: false });
        if (to.name === 'bill-adjustment-creation') {
          items.push({ text: 'AP Adjustment Creation', route: { name: 'bill-adjustment-creation' }, active: true });
        } else if (to.path.indexOf('/details') !== -1) {
          items.push({ text: 'AP Adjustment Detail', link: '#', active: true });
        }
      }
      return items;
    },
    onBillAdjustmentEdit(eventData) {
      this.$router.push({
        name: 'bill-adjustment-details',
        params: { entityId: eventData.item._id },
      }).catch((err) => { console.log(err); });
    },
    onBillAdjustmentCreate() {
      this.$router.push({ name: 'bill-adjustment-creation' }).catch((err) => { console.log(err); });
    },
  },
};
