import _ from 'lodash';
import { mapActions } from 'vuex';
import { selectMixin } from '../../mixins/select-mixin';
import { retrieveFailedNotification } from '../../utils/notifications';
import { toLanguageOption } from '../../utils/select2';
import LanguageService from '../../services/language-service';
import ServiceRequestLocker from '../../services/service-request-locker';

const languageService = new LanguageService();
const serviceRequestLocker = new ServiceRequestLocker(languageService);

export default {
  mixins: [selectMixin],
  props: {
    value: {
      type: Array,
    },
    excludedLanguages: {
      type: Array,
      default: () => [],
    },
    defaultValue: {
      type: Object,
    },
    options: {
      type: Array,
      default: () => [],
    },
    placeholder: {
      type: String,
      default: 'Select languages',
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    fetchOnCreated: {
      type: Boolean,
      default: true,
    },
    customFilteredOptions: {
      type: Function,
      default: null,
    },
  },
  data() {
    return {
      languages: [],
      currentValues: [],
      userSelectedLanguages: [],
      loading: false,
    };
  },
  computed: {
    languageOptions() {
      const availableLanguages = _.differenceBy(this.languages, this.excludedLanguages, 'isoCode');
      return availableLanguages.map(toLanguageOption);
    },
    selectedLanguages() {
      const definedValues = this.currentValues.filter((v) => !_.isNil(v));
      if (!_.isEmpty(definedValues)) {
        return definedValues.map(toLanguageOption);
      }
      return [];
    },
  },
  created() {
    this.languages = this.options;
    if (!_.isEmpty(this.value)) {
      this.currentValues = this.value;
    }
  },
  watch: {
    options: {
      handler: function (newValue) {
        this.languages = newValue;
      },
      immediate: true,
    },
    languages: {
      handler: function (languages) {
        let defaultValue;
        if (!_.isNil(this.defaultValue) && !_.isEmpty(languages)) {
          defaultValue = languages.find((l) => l.name.match(this.defaultValue.name));
        }
        if (!_.isNil(defaultValue)) {
          this.currentValues.push(defaultValue);
        }
        if (!_.isEmpty(languages) && !_.isEmpty(this.userSelectedLanguages)) {
          const selectedLanguages = this.userSelectedLanguages
            .map((lang) => languages.filter((l) => l.isoCode === lang.value)[0]);
          this.$emit('input', selectedLanguages);
        }
      },
      deep: true,
      immediate: true,
    },
    value: {
      handler: function (newValue) {
        this.currentValues = newValue;
      },
      immediate: true,
      deep: true,
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    _retrieve() {
      if (this.fetchOnCreated || _.isEmpty(this.languages)) {
        this.loading = true;
        return serviceRequestLocker.retrieve().then((response) => {
          this.languages = _.get(response, 'data.list', []);
        }).catch((err) => {
          const notification = retrieveFailedNotification('language', 5);
          notification.response = err;
          this.pushNotification(notification);
        }).finally(() => {
          this.loading = false;
        });
      }
    },
    onLanguageSelected(langs) {
      this.userSelectedLanguages = langs;
      if (!_.isEmpty(this.languages)) {
        const selectedLanguages = langs.map((lang) => this.languages.filter((l) => l.isoCode === lang.value)[0]);
        this.$emit('input', selectedLanguages);
      }
    },
  },
};
