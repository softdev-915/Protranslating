import _ from 'lodash';
import SubnetInput from './subnet-input.vue';

export default {
  props: {
    value: Object,
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    SubnetInput,
  },
  data() {
    return {
      ip: '',
      description: '',
      valid: true,
    };
  },
  created() {
    if (this.value !== null && this.value !== undefined) {
      this.ip = _.get(this.value, 'ip');
      this.description = _.get(this.value, 'description');
    }
  },
  watch: {
    value(newValue) {
      this.ip = _.get(newValue, 'ip');
      this.description = _.get(newValue, 'description');
      this._emitData();
    },
    ip() {
      this._emitData();
    },
    description() {
      this._emitData();
    },
    isValid(valid) {
      this.$emit('subnet-valid', valid);
    },
  },
  methods: {
    _emitData() {
      this.$emit('input', {
        ip: this.ip,
        description: this.description,
      });
    },
  },
  computed: {
    isDescriptionValid() {
      return this.description.length > 0;
    },
    isValid() {
      return this.valid && this.isDescriptionValid;
    },
  },
};
