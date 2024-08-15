import { mapGetters } from 'vuex';
import { hasRole } from '../../../utils/user';

export default {
  components: {
  },
  props: {
    query: Object,
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canCreate() {
      return hasRole(this.userLogged, 'IP-ORDER_CREATE_OWN');
    },
  },
  methods: {
    onCreate() {
      this.$emit('company-minimum-charge-creation');
    },
    onEdit(eventData) {
      this.$emit('company-minimum-charge-edition', eventData);
    },
  },
};
