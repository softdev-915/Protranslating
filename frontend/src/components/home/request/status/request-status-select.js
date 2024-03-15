
import _ from 'lodash';
import { BasicSelect } from '../../../search-select';

const CUSTOM_PROPS = ['options', 'selectedOption'];
const getVueSearchSelectInheritedProps = () => {
  const basicSelectMixins = _.get(BasicSelect, 'mixins', []);
  const basicSelectProps = _.get(BasicSelect, 'props', {});
  const mixinsProps = basicSelectMixins
    .filter(mixin => !_.isEmpty(mixin.props))
    .reduce((accumulator, currentValue) => {
      const currentProps = _.get(currentValue, 'props', {});
      return Object.assign({}, accumulator, currentProps);
    }, {});
  return Object.assign(basicSelectProps, mixinsProps);
};

export default {
  props: {
    value: {
      type: String,
    },
    options: {
      type: Array,
    },
    placeholder: {
      type: String,
      default: '',
    },
    emptyOption: {
      type: Object,
      default: () => ({ text: '', value: '' }),
    },
    formatOption: {
      type: Function,
      default: option => ({ text: `${option}`, value: option }),
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    mandatory: {
      type: Boolean,
      default: false,
    },
    ..._.omit(getVueSearchSelectInheritedProps(), CUSTOM_PROPS),
  },
  data() {
    return {
      selectedOption: {},
      formattedOptions: [],
    };
  },
  created() {
    const formattedSelectedOption = this.getFormattedSelectedOption(this.value);
    if (!_.isNil(formattedSelectedOption)) {
      this.selectedOption = formattedSelectedOption;
    }
  },
  watch: {
    options: {
      handler(newOptions) {
        this.setFormattedOptions(newOptions);
      },
      immediate: true,
    },
    value(newValue, oldValue) {
      if (!_.isEqual(oldValue, newValue)) {
        this.selectOption(newValue);
      }
    },
    formatOption() {
      this.setFormattedOptions(this.options);
    },
  },
  computed: {
    containerClass() {
      if (this.$attrs.mandatory || this.mandatory) {
        const value = _.get(this, 'selectedOption.value', '');
        const text = _.get(this, 'selectedOption.text', '');
        if (_.isEmpty(value) || _.isEmpty(text)) {
          return 'has-danger';
        }
        return '';
      }
    },
  },
  methods: {
    onSelect(selected) {
      const isSelectedEmpty = _.isEmpty(selected);
      if (!isSelectedEmpty) {
        this.selectedOption = selected;
      } else {
        this.selectedOption = _.get(this, 'emptyOption', {});
      }
      const selectedValue = _.get(this, 'selectedOption.value');
      if (!_.isEqual(selectedValue, this.value)) {
        this.$emit('input', selectedValue);
        this.$emit('change', selectedValue);
      }
    },
    selectOption(newValue) {
      if (_.isNil(newValue) && !_.isEmpty(this.value)) {
        newValue = this.value;
      }
      const selectedOption = this.formattedOptions.find((option) => {
        const optionValue = _.get(option, 'value', null);
        return _.isEqual(optionValue, newValue);
      });
      this.onSelect(selectedOption);
    },
    setFormattedOptions(options = []) {
      const newFormattedOptions = options.map(this.formatOption);
      if (!_.isEqual(this.formattedOptions, newFormattedOptions)) {
        this.formattedOptions = newFormattedOptions;
        this.selectOption(this.value);
      }
    },
    getFormattedSelectedOption(value) {
      let result;
      if (_.isString(value)) {
        result = { text: value, value: value };
      } else if (_.isObject(value)) {
        result = _.has(value, 'text') ? value : this.formatOption(value);
      }
      return result;
    },
    deletedCustomAttr(option) {
      if (option.terminated) {
        return 'option-terminated';
      }
      if (option.disabled) {
        return 'option-disabled';
      }
      return '';
    },
  },
};
