import _ from 'lodash';
import { selectMixin } from '../../mixins/select-mixin';
import LanguageService from '../../services/language-service';
import ServiceRequestLocker from '../../services/service-request-locker';
import SimpleBasicSelect from '../form/simple-basic-select.vue';
import notificationMixin from '../../mixins/notification-mixin';

const languageService = new LanguageService();
const serviceRequestLocker = new ServiceRequestLocker(languageService);
const CUSTOM_PROPS = [
  'value',
  'options',
  'formatOption',
  'filterOption',
  'filterOptionContext',
  'emptyOption',
  'preFetchOption',
  'entityName',
  'maxOptionsTimeout',
];
const CUSTOM_LISTENERS = ['input'];

export default {
  components: { SimpleBasicSelect },
  mixins: [selectMixin, notificationMixin],
  props: {
    fetch: {
      type: Boolean,
      default: true,
    },
    value: {
      type: Object,
    },
    placeholder: {
      type: String,
      default: 'Select language',
    },
    customClass: {
      type: String,
    },
    fetchOnCreated: {
      type: Boolean,
      default: true,
    },
    excludedLanguages: {
      type: Array,
      default: () => [],
    },
    options: {
      type: Array,
      default: () => [],
    },
    filterOptionsFromDeleted: {
      type: Boolean,
      default: true,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    shouldDisableIfEmptyOptions: {
      type: Boolean,
      default: false,
    },
    formatOption: {
      type: Function,
      default: ({ name = '', isoCode = '' }) => ({
        text: name,
        value: { isoCode, name },
      }),
    },
    emptyOption: {
      type: Object,
      default: () => ({ text: '', value: {} }),
    },
    filterOption: {
      type: Function,
      default: ({ isoCode = '' }, { excludedLanguages = [] }) => {
        const excluded = excludedLanguages.find(({ isoCode: excludedIsoCode } = {}) =>
          excludedIsoCode === isoCode
        );
        return _.isNil(excluded);
      },
    },
    nonRemovableValues: {
      type: Set,
      default: () => new Set(),
    },
    allowCustomOptions: {
      type: Boolean,
      default: false,
    },
    ..._.omit(SimpleBasicSelect.props, CUSTOM_PROPS),
  },
  created() {
    this.filterOptionContext = { excludedLanguages: this.excludedLanguages };
    if (this.fetchOnCreated && this.needRetrieveOptions) {
      this._retrieve();
      this.preFetchOption = this.emptyOption;
    } else if (_.isNil(this.value)) {
      this.preFetchOption = this.emptyOption;
    } else {
      this.preFetchOption = this.formatOption(this.value);
    }
  },
  data() {
    return {
      languages: [],
      languageOptions: this.options,
      loading: false,
      selected: null,
    };
  },
  watch: {
    options(newValue) {
      this.setLanguageOptions(newValue);
    },
    value: {
      handler(newValue) {
        this.selected = newValue;
      },
      immediate: true,
    },
    selected(newValue, oldValue) {
      if (_.get(newValue, 'isoCode') !== _.get(oldValue, 'isoCode')) {
        this.$emit('input', newValue);
      }
    },
  },
  computed: {
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
    containerClass() {
      return {
        [this.customClass]: true,
        'has-danger': this.mandatory && _.isEmpty(_.get(this, 'selected.name')),
        'blur-loading-row': this.loading,
      };
    },
    needRetrieveOptions() {
      return _.isEmpty(this.languages) && this.fetch;
    },
    isDisabledSelection() {
      return this.isDisabled
        || (
          this.shouldDisableIfEmptyOptions
          && !this.needRetrieveOptions
          && _.isEmpty(this.languageOptions)
        );
    },
  },
  methods: {
    async _retrieve() {
      this.loading = true;
      try {
        const response = await serviceRequestLocker.retrieve();
        this.languages = _.get(response, 'data.list', []);
        this.setLanguageOptions(this.options);
      } catch (e) {
        this.pushError(e.message, e);
      }
      this.loading = false;
    },
    setLanguageOptions(options) {
      let result = this.languages;
      if (!_.isEmpty(options) && this.filterOptionsFromDeleted) {
        result = options.filter((option) => {
          const optionIndex = this.languages.findIndex(
            language => language.isoCode === option.isoCode
          );
          return this.allowCustomOptions || optionIndex !== -1;
        });
      }
      this.languageOptions = result;
    },
    onClick() {
      if (this.needRetrieveOptions) {
        this.retrieveOptions();
      }
    },
  },
};
