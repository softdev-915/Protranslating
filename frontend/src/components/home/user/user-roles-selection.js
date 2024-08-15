import { mapActions, mapGetters } from 'vuex';

export default {
  data() {
    return {
      rolesSelected: [],
    };
  },
  props: {
    value: {
      type: Array,
      default: () => [],
    },
  },
  watch: {
    value(newValue) {
      this.rolesSelected = newValue;
    },
    rolesSelected(newRoles) {
      this.$emit('input', newRoles);
    },
  },
  mounted: function () {
    this.retrieveRoles();
  },
  computed: {
    ...mapGetters('authorization', ['roles']),
  },
  methods: {
    ...mapActions('authorization', ['retrieveRoles']),
  },
};
