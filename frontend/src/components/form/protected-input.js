export default {
  inject: ['$validator'],
  props: {
    value: {
      type: String,
      required: true,
    },
    canEdit: {
      type: Boolean,
      default: false,
    },
    canRead: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: '',
    },
    required: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      isPasswordVisible: false,
    };
  },
  computed: {
    rules() {
      const validationRules = {};
      if (this.required) {
        validationRules.required = true;
      }
      return validationRules;
    },
  },
};
