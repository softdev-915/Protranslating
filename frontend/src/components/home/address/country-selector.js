import _ from 'lodash';
import { mapActions } from 'vuex';
import { BasicSelect } from '../../search-select';
import CountryService from '../../../services/country-service';
import ServiceRequestLocker from '../../../services/service-request-locker';

const countryService = new CountryService();
const countryServiceLocker = new ServiceRequestLocker(countryService);
const CUSTOM_PROPS = ['options', 'selected-option', 'selectedOption'];
const MixinProps = BasicSelect.mixins.filter((m) => m.props).reduce((acc, cur) => ({ ...acc, ...cur.props }), {});
const VueSearchSelectInheritedProps = { ...BasicSelect.props, ...MixinProps };

export default {
  props: {
    value: {
      type: [Object, String],
      default: () => ({}),
    },
    availableCountries: {
      type: Array,
    },
    optionsFormatter: {
      type: Function,
      default: (c) => ({ text: c.name, value: c._id }),
    },
    defaultName: String,
    ..._.omit(VueSearchSelectInheritedProps, CUSTOM_PROPS),
  },
  data() {
    return {
      loading: false,
      options: [],
    };
  },
  watch: {
    value(newValue) {
      this.selected = newValue;
    },
    availableCountries: {
      immediate: true,
      handler(newValue) {
        this.fillOptionList(newValue).then(this.setDefaultOption);
      },
    },

  },
  computed: {
    customProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    customListeners() {
      return this.$listeners;
    },
    selectedCountry() {
      if (typeof this.value === 'string') {
        const found = this.options.find((o) => o._id === this.value);
        if (found) {
          return { text: found.name, value: this.value };
        }
        return { text: '', value: '' };
      }
      if (_.get(this, 'value._id', false)) {
        return {
          value: this.value._id,
          text: this.value.name,
        };
      }
      return { value: '', text: '' };
    },
    defaultCountry() {
      let found;
      if (this.defaultName) {
        found = this.options.find((o) => o.name === this.defaultName);
      }
      return { text: _.get(found, 'name', ''), value: _.get(found, '_id', '') };
    },
    countryOptions() {
      return this.options.map(this.optionsFormatter);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onCountrySelected(country) {
      this.$emit('input', { name: country.text, _id: country.value });
    },
    _retrieveCountry() {
      this.loading = true;
      return countryServiceLocker.retrieve().then((response) => {
        this.options = response.data.list.filter((e) => !e.deleted);
      })
        .catch((err) => {
          const notification = {
            title: 'Error',
            message: 'Country could not be retrieved',
            state: 'danger',
            response: err,
          };
          this.pushNotification(notification);
        })
        .finally(() => {
          this.selected = this.value;
          this.loading = false;
        });
    },
    fillOptionList(availableCountries) {
      if (Array.isArray(availableCountries)) {
        this.options = availableCountries;
      } else {
        return this._retrieveCountry();
      }
      return Promise.resolve([]);
    },
    setDefaultOption() {
      if (this.defaultName && _.isUndefined(this.value._id)) {
        const country = this.options.find((o) => o.name === this.defaultName);
        if (country) {
          this.$emit('input', country);
          this.$emit('select', { value: country._id });
        }
      }
    },
  },
};
