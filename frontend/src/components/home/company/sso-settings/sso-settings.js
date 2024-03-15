import _ from 'lodash';
import { mapGetters } from 'vuex';

export default {
  inject: ['$validator'],
  props: {
    value: {
      type: Object,
      required: true,
    },
    canEdit: {
      type: Boolean,
      default: true,
    },
    companyId: {
      type: String,
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canEditSSOFields() {
      const baseCheck = this.canEdit && _.get(this.value, 'ssoSettings.isSSOEnabled', false);
      if (this.hasParentCompany) {
        return baseCheck && this.value.areSsoSettingsOverwritten;
      }
      return baseCheck;
    },
    ssoSettings() {
      return _.get(this.value, 'ssoSettings') || {};
    },
    hasParentCompany() {
      return !_.isEmpty(_.get(this.value, 'parentCompany._id'));
    },
    consumerUrlValue() {
      const lspId = _.get(this, 'userLogged.lsp._id');
      return `${window.location.origin}/api/auth/ssoCallback/${lspId}/${this.companyId}`;
    },
    consumerUrlValidatorValue() {
      return `^${_.escapeRegExp(this.consumerUrlValue)}$`;
    },
  },
  watch: {
    value: {
      deep: true,
      handler() {
        this.validateForm();
      },
    },
  },
  methods: {
    validateForm() {
      this.$nextTick(async () => {
        const isValid = await this.$validator.validateAll();
        this.$emit('validation', (!this.canEdit || isValid));
      });
    },
  },
};
