<template>
  <div></div>
</template>
<script>
import _ from 'lodash';
import ShowHideToggle from './show-hide-toggle.vue';

export default {
  inject: ['$validator'],
  components: {
    ShowHideToggle,
  },
  props: {
    templateKey: {
      required: true,
      type: String,
    },
    templatePath: {
      required: true,
      type: String,
    },
    value: {
      required: true,
    },
    label: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: '',
    },
    validateRules: {
      type: [Object, String],
      default: '',
    },
    canHideField: {
      type: Boolean,
      default: false,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    labelText() {
      return !_.isEmpty(this.label) ? this.label : `${this.templatePath}.${this.templateKey}`;
    },
    placeholderText() {
      return !_.isEmpty(this.placeholder) ? this.placeholder : 'Enter text';
    },
    isRequired() {
      return this.isValidateRulesContain(this.validateRules, 'required');
    },
    isValid() {
      const hasError = this.errors.has(this.templateKey);
      const isEmptyRequired = this.isRequired && _.isEmpty(this.value);
      return !isEmptyRequired && !hasError;
    },
    isDisable() {
      return this.isHidden || this.readOnly;
    },
    dangerClass() {
      return { 'has-danger': !this.isValid };
    },
    valueModel: {
      get() {
        return this.value;
      },
      set(newValue) {
        this.emitInputEvent(newValue);
      },
    },
    e2eType() {
      return `template-field-${this.templatePath}-${this.templateKey}`;
    },
  },
  watch: {
    isValid: {
      immediate: true,
      handler(newValue, oldValue) {
        if (newValue !== oldValue) {
          this.$emit('is-valid-custom-field', newValue);
        }
      },
    },
  },
  methods: {
    emitInputEvent: _.debounce(function (value) {
      this.$emit('input', value);
    }, 300),
    isValidateRulesContain(validateRules, findRule) {
      let result = false;
      if (_.isString(validateRules)) {
        const explodedRules = validateRules.split('|');
        result = explodedRules.includes(findRule);
      } else if (_.isPlainObject(validateRules)) {
        result = _.has(validateRules, findRule);
      }
      return result;
    },
    toggleIsHidden() {
      this.$emit('toggle-is-hidden');
    },
  },
};
</script>
