import userRoleCheckMixin from '../../../mixins/user-role-check';

export default {
  mixins: [userRoleCheckMixin],
  props: {
    query: Object,
  },
  computed: {
    canCreate() {
      return this.hasRole('IP-QUOTE_CREATE_OWN');
    },
    canCreateOther() {
      return [
        'REQUEST_CREATE_OWN',
        'REQUEST_CREATE_COMPANY',
      ].some((r) => this.hasRole(r));
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
