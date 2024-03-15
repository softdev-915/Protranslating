import _ from 'lodash';
import Promise from 'bluebird';
import { mapGetters, mapActions } from 'vuex';
import { MultiSelect } from '../../search-select';
import LocationService from '../../../services/location-service';
import { hasRole } from '../../../utils/user';

const service = new LocationService();
const CUSTOM_PROPS = ['options', 'selectedOptions', 'isDisabled'];
const MixinProps = MultiSelect.mixins.filter((m) => m.props).reduce((acc, cur) => ({ ...acc, ...cur.props }), {});
const VueSearchSelectInheritedProps = { ...MultiSelect.props, ...MixinProps };
const buildInitialState = () => ({
  options: [],
  loading: false,
});

export default {
  created() {
    if (this.locationsAvailable) {
      this.options = this.locationsAvailable;
    } else {
      this._retrieve();
    }
  },

  data() {
    return buildInitialState();
  },

  props: {
    locationsAvailable: Array,
    value: { type: Array, required: true },
    ..._.omit(VueSearchSelectInheritedProps, CUSTOM_PROPS),
  },

  computed: {
    ...mapGetters('app', ['userLogged']),

    customProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    canRetrieve() {
      return hasRole(this.userLogged, 'LOCATION_READ_ALL');
    },
    locationsOptions() {
      if (Array.isArray(this.options)) {
        return this.options.map((o) => ({ text: o.name, value: o._id }));
      }
      return [];
    },
    selectedLocations() {
      return this.value.map((v) => ({ text: v.name, value: v._id }));
    },
  },

  methods: {
    ...mapActions('notifications', ['pushNotification']),

    onSelected(locations) {
      this.$emit('input', locations.map((l) => ({ name: l.text, _id: l.value })));
    },
    _retrieve() {
      return new Promise((resolve, reject) => {
        if (!this.canRetrieve) {
          reject();
        }
        resolve();
      })
        .then(() => {
          this.loading = true;
          return service.retrieve();
        })
        .then((response) => {
          this.options = response.data.list;
        })
        .catch((err) => {
          const notification = {
            title: 'Error',
            message: 'Locations could not be retrieved',
            state: 'danger',
            response: err,
          };
          this.pushNotification(notification);
        })
        .finally(() => {
          this.loading = false;
        });
    },
  },
};
