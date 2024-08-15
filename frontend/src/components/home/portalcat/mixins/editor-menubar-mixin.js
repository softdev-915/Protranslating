/* global window */
import _ from 'lodash';

export default {
  props: {
    value: Object,
    isEditorEmpty: Boolean,
  },
  computed: {
    filters() {
      return _.get(this, 'value.filters', {});
    },
    displayOptions() {
      return _.get(this, 'value.displayOptions', {});
    },
  },
  methods: {
    isFilterOn(name, values, filters = this.filters) {
      const filter = filters[name];
      values = Array.isArray(values) ? values : [values];
      return !_.isNil(filter) && values.every(value => filter.includes(value));
    },
    toggleFilter(name, values, filtersObj = this.filters, emitInput = this.emitInput) {
      let filter = _.clone(filtersObj[name]);
      values = Array.isArray(values) ? values : [values];
      values.forEach((value) => {
        if (_.isNil(filter)) {
          filter = [];
        }
        if (!filter.includes(value)) {
          filter.push(value);
        } else {
          filter = filter.filter(v => v !== value);
        }
      });
      if (_.isEmpty(filter)) {
        filter = null;
      }
      const filters = { ...filtersObj, [name]: filter };
      emitInput({ filters });
    },
    updateDisplayOptions(param, value) {
      const displayOptions = { ...this.displayOptions, [param]: value };
      this.emitInput({ displayOptions });
    },
    emitInput(newValue) {
      this.$emit('input', { ...this.value, ...newValue });
    },
  },
};
