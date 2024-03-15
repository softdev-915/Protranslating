import { mapGetters } from 'vuex';
import { sectionRouterMixin } from '../../../mixins/section-router';
import UrlBasedBreadcrumb from '../url-based-breadcrumb/url-based-breadcrumb.vue';

const apPaymentGrid = {
  text: 'AP Payments Grid',
  route: { name: 'list-ap-payment' },
};
const apPaymentCreation = {
  text: 'AP Payment Creation',
  route: { name: 'ap-payment-creation' },
};
const apPaymentDetails = {
  text: 'AP Payment Details',
  route: { name: 'ap-payment-details' },
};

export default {
  mixins: [sectionRouterMixin],
  components: {
    UrlBasedBreadcrumb,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
  },
  methods: {
    buildBreadcrumbItems(to) {
      const items = [];
      switch (to.name) {
        case apPaymentGrid.route.name:
          items.push({ ...apPaymentGrid, active: true });
          break;
        case apPaymentCreation.route.name:
          items.push({ ...apPaymentGrid, active: false });
          items.push({ ...apPaymentCreation, active: true });
          break;
        case apPaymentDetails.route.name:
          items.push({ ...apPaymentGrid, active: false });
          items.push({ ...apPaymentDetails, active: true });
          break;
        default:
          throw new Error(`Route ${to.name} not found`);
      }
      return items;
    },
    onEdit(eventData) {
      this.$router.push({
        name: 'ap-payment-details',
        params: {
          entityId: eventData.item._id,
        },
      }).catch((err) => { console.log(err); });
    },
    onCreation() {
      this.$router.push({ name: 'ap-payment-creation' }).catch((err) => { console.log(err); });
    },
  },
};
