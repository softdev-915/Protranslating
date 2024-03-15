import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import { BasicSelect } from '../../search-select';
import { selectMixin } from '../../../mixins/select-mixin';
import { hasRole } from '../../../utils/user';
import LocationService from '../../../services/location-service';
import ServiceRequestLocker from '../../../services/service-request-locker';

const CUSTOM_PROPS = ['options', 'selected-option', 'selectedOption'];
const CUSTOM_LISTENERS = ['select'];
// Add non inherited props from mixins
const MixinProps = BasicSelect.mixins.filter((m) => m.props).reduce((acc, cur) => ({ ...acc, ...cur.props }), {});
const VueSearchSelectInheritedProps = Object.assign(BasicSelect.props, MixinProps);
const buildInitialState = () => ({
  options: [],
  loading: false,
  selectedOption: {
    text: '',
    value: '',
  },
});
const service = new LocationService();
const serviceRequestLocker = new ServiceRequestLocker(service);

export default {
  mixins: [selectMixin],
  props: {
    value: {
      type: [Object, String],
    },
    locationsAvailable: {
      type: Array,
    },
    returnFullOption: {
      type: Boolean,
      default: false,
    },
    ..._.omit(VueSearchSelectInheritedProps, CUSTOM_PROPS),
  },
  data() {
    return buildInitialState();
  },
  created() {
    if (this.locationsAvailable) {
      this.options = this.locationsAvailable;
    }
    this._selectOption(this.value);
  },
  watch: {
    selectedOption(newValue) {
      if (this.returnFullOption) {
        const location = this.options.find((option) => _.get(newValue, 'value') === option._id);
        this.$emit('input', {
          _id: _.get(location, '_id', null),
          name: _.get(location, 'name', ''),
          city: _.get(location, 'city', ''),
          address: _.get(location, 'address', ''),
          suite: _.get(location, 'suite', ''),
          country: _.get(location, 'country.name', _.get(location, 'country', '')),
          state: _.get(location, 'state.name', _.get(location, 'state', '')),
          zip: _.get(location, 'zip', ''),
          phone: _.get(location, 'phone', ''),
        });
      } else {
        this.$emit('input', newValue.value);
      }
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canRetrieve() {
      return hasRole(this.userLogged, 'LOCATION_READ_ALL');
    },
    locationOptions() {
      if (Array.isArray(this.options)) {
        return this.options.map((c) => ({
          text: c.name,
          value: c._id,
        }));
      }
      return [];
    },
    customProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    customListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    _selectOption(newValue) {
      const _id = _.get(newValue, '_id', _.get(newValue, 'value'));
      const location = this.options.find((b) => b._id === _id);
      const name = _.get(location, 'name', _.get(this.value, 'name', ''));
      this.selectedOption = { text: name, value: _id };
    },
    onLocationSelect(location) {
      this._selectOption(location);
    },
    _retrieve() {
      if (this.canRetrieve) {
        this.loading = true;
        return serviceRequestLocker.retrieve()
          .then((response) => {
            this.options = response.data.list;
            return this.options;
          })
          .catch((err) => {
            const notification = {
              title: 'Error',
              message: 'Request type list could not be retrieved',
              state: 'danger',
              response: err,
            };
            this.pushNotification(notification);
          })
          .finally(() => {
            this.loading = false;
          });
      }
      return Promise.resolve([]);
    },
  },
};
