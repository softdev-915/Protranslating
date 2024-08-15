import PortalCat from './portalcat.vue';
import PcStoreMixin from './mixins/pc-store-mixin';

export default {
  mixins: [
    PcStoreMixin,
  ],
  components: {
    PortalCat,
  },
  beforeRouteLeave(to, from, next) {
    this.resetState();
    next();
  },
};
