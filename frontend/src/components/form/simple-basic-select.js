import _ from 'lodash';
import { mapActions } from 'vuex';
import { BasicSelect } from '../search-select';

const CUSTOM_PROPS = ['options', 'selectedOption'];
const CUSTOM_LISTENERS = ['select'];
const getVueSearchSelectInheritedProps = () => {
  const basicSelectMixins = _.get(BasicSelect, 'mixins', []);
  const basicSelectProps = _.get(BasicSelect, 'props', {});
  const mixinsProps = basicSelectMixins
    .filter((mixin) => !_.isEmpty(mixin.props))
    .reduce((accumulator, currentValue) => {
      const currentProps = _.get(currentValue, 'props', {});
      return { ...accumulator, ...currentProps };
    }, {});
  return Object.assign(basicSelectProps, mixinsProps);
};

/**
 * Emits:
 * input - to update the `value` prop.
 * select - to handle event when new value is selected.
 * delete - to handle event when value is deleted.
 * change - to handle any change of the `value`.
 * options-loaded - to get resolved data of options promise if needed
 */
export default {
  name: 'simple-basic-select',
  data() {
    return {
      selectedOption: {},
      isWaitingForOptionsPromise: false,
      formattedOptions: [],
      optionsTimeout: { msPassed: 0, timerId: 0 },
    };
  },
  props: {
    options: {
      type: [Array, Promise, Object],
      default: () => [],
    },
    value: {
      default: '',
    },
    emptyOption: {
      type: Object,
      default: () => ({ text: '', value: '' }),
    },
    formatOption: {
      type: Function,
      default: (option) => ({ text: `${option}`, value: option }),
    },
    filterOption: {
      type: Function,
      default: () => true,
    },
    filterOptionContext: {
      type: Object,
      default: () => {},
    },
    maxOptionsTimeout: {
      type: Number,
      default: 1000,
    },
    optionsCheckTimeout: {
      type: Number,
      default: 250,
    },
    preFetchOption: {
      type: Object,
    },
    entityName: {
      type: String,
      default: 'Entity',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    mandatory: {
      type: Boolean,
      default: false,
    },
    allowSelectedNotInList: {
      type: Boolean,
      default: false,
    },
    nonRemovableValues: {
      type: Set,
      default: () => new Set(),
    },
    ..._.omit(getVueSearchSelectInheritedProps(), CUSTOM_PROPS),
  },
  created() {
    if (!this.fetchOnCreated) {
      const formattedSelectedOption = this.getFormattedSelectedOption(this.value);
      if (!_.isNil(formattedSelectedOption)) {
        this.selectedOption = formattedSelectedOption;
      }
    }
  },
  computed: {
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
    containerClass() {
      if (this.$attrs.mandatory || this.mandatory) {
        const value = _.get(this, 'selectedOption.value');
        const text = _.get(this, 'selectedOption.text');
        if (_.isEmpty(value) || _.isEmpty(text)) {
          return 'has-danger';
        }
        if (_.isEmpty(_.get(this, 'selectedOption.text', ''))) {
          return 'has-danger';
        }
        return '';
      }
    },
    isWaitingForPossibleOptions() {
      return this.optionsTimeout.msPassed <= this.maxOptionsTimeout;
    },
    isWaitingForOptions() {
      if (!this.fetchOnCreated) {
        return false;
      }
      return this.isWaitingForOptionsPromise || this.isWaitingForPossibleOptions;
    },
  },
  watch: {
    options: {
      handler(newOptions) {
        this.updateOptions(newOptions);
      },
      immediate: true,
    },
    filterOptionContext() {
      this.updateOptions(this.options);
    },
    value(newValue, oldValue) {
      if (!_.isEqual(oldValue, newValue)) {
        this.selectOption(newValue);
      }
    },
    formatOption() {
      this.updateOptions(this.options);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onSelect(selected) {
      const isSelectedEmpty = _.isEmpty(selected);
      const areOptionsEmpty = _.isEmpty(this.formattedOptions);
      if (!isSelectedEmpty) {
        this.selectedOption = selected;
      } else {
        const emptyOption = _.get(this, 'emptyOption', {});
        const preFetchOption = _.get(this, 'preFetchOption', {});
        this.selectedOption = areOptionsEmpty && !_.isEmpty(preFetchOption)
          ? preFetchOption
          : emptyOption;
      }
      const selectedValue = _.get(this, 'selectedOption.value');
      if (!_.isEqual(selectedValue, this.value)) {
        this.$emit('input', selectedValue);
        this.$emit(isSelectedEmpty && !areOptionsEmpty ? 'delete' : 'select', selectedValue);
        this.$emit('change', selectedValue);
      }
    },
    async updateOptions(newOptions) {
      let optionsArray;
      if (_.get(newOptions, 'promise', newOptions) instanceof Promise) {
        optionsArray = await this.resolveOptionsPromise(newOptions);
        this.$emit('options-loaded', _.get(optionsArray, 'data.list', []));
      } else if (_.isArray(newOptions)) {
        optionsArray = newOptions;
        this.$emit('options-loaded', optionsArray || []);
      }
      this.setFormattedOptions(optionsArray);
    },
    selectOption(newValue) {
      if (_.isNil(newValue) && !_.isEmpty(this.value)) {
        newValue = this.value;
      }
      if (this.isWaitingForOptions) {
        setTimeout(() => {
          this.selectOption(newValue);
        }, this.optionsCheckTimeout);
        return;
      }

      const formattedOption = this.formattedOptions.find((option) => {
        const optionValue = _.get(option, 'value', null);
        return _.isEqual(optionValue, newValue);
      });
      const selectedOption = _.isEmpty(formattedOption) && this.allowSelectedNotInList
        ? this.getFormattedSelectedOption(newValue)
        : formattedOption;
      this.onSelect(selectedOption);
    },
    async resolveOptionsPromise(promise) {
      this.isWaitingForOptionsPromise = true;
      let options = [];
      try {
        options = await promise;
      } catch (error) {
        this.pushNotification({
          title: 'Error',
          message: `${this.entityName} select options could not be retrieved`,
          state: 'danger',
          response: error,
        });
        options = [];
      }
      this.isWaitingForOptionsPromise = false;
      return options;
    },
    setFormattedOptions(options = []) {
      options = _.get(options, 'data.list', options);
      const newFormattedOptions = options
        .filter((option) => this.filterOption(option, this.filterOptionContext))
        .map(this.formatOption);
      if (!_.isEqual(this.formattedOptions, newFormattedOptions)) {
        this.finishPossibleOptionsWaiting();
        this.formattedOptions = newFormattedOptions;
        this.$emit('options-loaded', options);
        this.selectOption(this.value);
      } else if (this.isWaitingForPossibleOptions) {
        if (!_.isEmpty(this.preFetchOption)) {
          this.selectOption(null);
        }
        const optionsCheckTimeout = _.get(this, 'optionsCheckTimeout', 0);
        const timerId = setInterval(this.countOptionsTimeout, optionsCheckTimeout);
        _.set(this, 'optionsTimeout.timerId', timerId);
      }
    },
    countOptionsTimeout() {
      if (!this.isWaitingForPossibleOptions) {
        this.finishPossibleOptionsWaiting();
      } else {
        this.optionsTimeout.msPassed += this.optionsCheckTimeout;
      }
    },
    finishPossibleOptionsWaiting() {
      this.optionsTimeout.msPassed = this.maxOptionsTimeout + 1;
      if (this.optionsTimeout.timerId !== 0) {
        clearInterval(this.optionsTimeout.timerId);
        this.optionsTimeout.timerId = 0;
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
  },
};
