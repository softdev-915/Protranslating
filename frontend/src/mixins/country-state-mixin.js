import _ from 'lodash';
import { mapActions } from 'vuex';
import StateService from '../services/state-service';
import CountryService from '../services/country-service';
import CountrySelector from '../components/home/address/country-selector.vue';

const stateService = new StateService();
const countryService = new CountryService();
const buildInitialState = () => ({
  countries: [],
  states: [],
  countriesLoading: false,
  statesLoading: false,
});

/**
 * Mixin assumes there are two computed properties defined on the component:
 * country and state with getter and setter. This is due backward compatibility.
 * Address-information component stores state and country and state in this.value
 * When location-edit component stores those in this.location
 */

export const CountryStateMixin = {
  props: {
    availableCountries: {
      type: Array,
      default: () => [],
    },
  },

  components: {
    CountrySelector,
  },

  data() {
    return buildInitialState();
  },

  watch: {
    country: {
      handler(value, oldValue) {
        if (value !== oldValue) {
          this._retrieveStates();
        }
      },
      immediate: true,
    },
  },

  created() {
    this.countries = this.availableCountries;
    if (_.isEmpty(this.countries)) {
      this._retrieveCountries();
    }
  },

  computed: {
    selectedState() {
      const state = _.get(this, 'value.state') || _.get(this, 'location.state');
      const stateId = _.get(state, '_id', state);
      const stateFound = this.states.find((s) => s._id === stateId);
      if (_.get(stateFound, 'name')) {
        return { text: stateFound.name, value: stateFound._id };
      }
      return { text: '', value: '' };
    },
    stateOptions() {
      return this.states.map((s) => ({
        text: s.name,
        value: s._id,
      }));
    },
  },

  methods: {
    ...mapActions('notifications', ['pushNotification']),

    onCountrySelected(country) {
      country = this.countries.find((o) => o._id === country.value);
      this.setCountry(country);
      this.setState({});
      this._retrieveStates();
    },

    onStateSelected(state) {
      this.setState(this.states.find((o) => o._id === state.value));
    },

    _retrieveCountries() {
      this.countriesLoading = true;
      return countryService.retrieve().then((response) => {
        this.countries = response.data.list;
      })
        .catch((err) => {
          const notification = {
            title: 'Error',
            message: 'Countries could not be retrieved',
            state: 'danger',
            response: err,
          };
          this.pushNotification(notification);
        })
        .finally(() => {
          this.countriesLoading = false;
          this._retrieveStates();
        });
    },

    _retrieveStates() {
      const countryId = _.get(this.country, '_id', this.country);
      if (typeof countryId === 'string') {
        this.statesLoading = true;
        return stateService.retrieve({ country: countryId })
          .then((response) => {
            this.states = response.data.list;
          })
          .catch((err) => {
            const notification = {
              title: 'Error',
              message: 'States could not be retrieved',
              state: 'danger',
              response: err,
            };
            this.pushNotification(notification);
          })
          .finally(() => {
            this.statesLoading = false;
          });
      }
    },
  },
};
