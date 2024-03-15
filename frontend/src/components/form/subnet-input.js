/* eslint-disable no-empty */
import { isNil, isEmpty } from 'lodash';
import { Address4, Address6 } from 'ip-address';

export default {
  props: {
    value: String,
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      ip: '',
    };
  },
  created() {
    if (!isNil(this.value) && !isEmpty(this.value)) {
      this.ip = this.value;
    }
  },
  watch: {
    value(newValue) {
      this.ip = newValue;
      this.$emit('input', this.ip);
    },
    ip() {
      this.$emit('input', this.ip);
    },
    isValid(newValid) {
      this.$emit('subnet-valid', newValid);
    },
  },
  computed: {
    isValid() {
      try {
        const address4 = new Address4(this.ip);
        return address4;
      } catch (error) {}
      try {
        const address6 = new Address6(this.ip);
        return address6;
      } catch (error) {}
    },
  },
};
