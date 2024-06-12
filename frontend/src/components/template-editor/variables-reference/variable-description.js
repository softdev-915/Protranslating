import VariablesReference from './variables-reference.vue';

const _variableReadableType = (v) => {
  const type = typeof v;
  if (type === 'object') {
    if (v instanceof Date) {
      return 'date';
    } if (Array.isArray(v)) {
      return 'array';
    }
    return 'object';
  }
  return type;
};
const _isPlainObject = (o) => _variableReadableType(o) === 'object';

export default {
  name: 'variable-description',
  beforeCreate: function () {
    // breaks recursive import
    this.$options.components.VariablesReference = VariablesReference;
  },
  props: {
    arr: {
      type: Array,
    },
    date: {
      type: Date,
    },
    num: {
      type: Number,
    },
    str: {
      type: String,
    },
    bool: {
      type: Boolean,
    },
    name: {
      type: String,
      required: true,
    },
    obj: {
      type: Boolean,
      default: false,
    },
    parentPath: {
      type: String,
      default: '',
    },
  },
  computed: {
    arrVal() {
      if (this.arr) {
        return this.arr.join(', ');
      }
      return undefined;
    },
    value() {
      return this.arrVal || this.date
        || this.num || this.str || this.bool;
    },
    readableType() {
      if (this.arr) {
        if (this.obj) {
          return 'array<object>';
        }
        const type = _variableReadableType(this.arr[0]);
        return `array<${type}>`;
      } if (this.obj) {
        return 'object';
      } if (this.date !== undefined) {
        return 'date';
      } if (this.num !== undefined) {
        return 'number';
      } if (this.str !== undefined) {
        return 'string';
      }
      return 'boolean';
    },
    type() {
      if (this.obj) {
        return 'object';
      } if (this.arr && _isPlainObject(this.arr[0])) {
        return 'array';
      }
      return 'simple';
    },
  },
};
