import _ from 'lodash';
import { isEmail } from '../../utils/form';

const CUSTOM_LISTENERS = ['input'];

export default {
  props: {
    elemId: {
      type: String,
    },
    vValidate: {
      type: String,
    },
    elemName: {
      type: String,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    allowEmpty: {
      type: Boolean,
      default: false,
    },
    autocomplete: {
      type: String,
    },
    ariaLabel: {
      type: String,
    },
    cssClass: {
      type: String,
    },
    invalidClass: {
      type: String,
    },
    invalidAndDirtyClass: {
      type: String,
    },
    validClass: {
      type: String,
    },
    placeholder: {
      type: String,
    },
    styles: {
      type: String,
    },
    value: {
      type: String,
      default: '',
    },
  },
  created() {
    this.email = this.value;
  },
  data() {
    return {
      email: '',
      dirty: false,
    };
  },
  computed: {
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
    isValid() {
      const isValidEmail = (this.allowEmpty && this.email === '') || isEmail(this.email);
      this.$emit('email-validation', isValidEmail);
      return isValidEmail;
    },
    classes() {
      let classes = this.cssClass || '';
      if (this.isValid && this.validClass) {
        classes = `${classes} ${this.validClass}`;
      } else if (!this.isValid && this.dirty && this.invalidAndDirtyClass) {
        classes = `${classes} ${this.invalidAndDirtyClass}`;
      } else if (!this.isValid && this.invalidClass) {
        classes = `${classes} ${this.invalidClass}`;
      }
      return classes;
    },
  },
  watch: {
    value: function (newValue) {
      this.email = newValue;
    },
    email(newEmail) {
      if (newEmail) {
        this.dirty = true;
        const lowerCase = newEmail.toLowerCase();
        if (lowerCase === newEmail) {
          this.$emit('input', this.email);
        } else {
          this.email = lowerCase;
        }
      } else {
        this.$emit('input', this.email);
      }
    },
  },
  methods: {
    focus() {
      this.$refs.email.focus();
    },
    keyup(event) {
      this.$emit('keyup', event);
    },
    keydown(event) {
      this.$emit('keydown', event);
    },
    keypressed(event) {
      this.$emit('keypressed', event);
    },
  },
};
