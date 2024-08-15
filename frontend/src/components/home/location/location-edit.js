import _ from 'lodash';
import { mapGetters } from 'vuex';
import LocationService from '../../../services/location-service';
import AddressInformation from '../address/address-information.vue';
import { hasRole } from '../../../utils/user';
import { entityEditMixin } from '../../../mixins/entity-edit';
import { CountryStateMixin } from '../../../mixins/country-state-mixin';

const service = new LocationService();
const buildInitialState = () => ({
  location: {
    _id: '',
    name: '',
    address: '',
    suite: '',
    city: '',
    state: {
      name: '',
    },
    country: {
      name: '',
    },
    zip: '',
    phone: '',
    deleted: false,
    readDate: null,
  },
});

export default {
  mixins: [entityEditMixin, CountryStateMixin],

  components: {
    AddressInformation,
  },

  data() {
    return buildInitialState();
  },

  methods: {
    _service() {
      return service;
    },

    validateBeforeSubmit() {
      this.$validator.validateAll().then((isValid) => {
        if (isValid) {
          this.save();
        }
      });
    },

    _handleCreate(response) {
      this.location._id = response.data.location_id;
    },

    _handleRetrieve(response) {
      this.location = response.data.location;
    },

    save() {
      const clone = _.cloneDeep(this.location);
      this._save(clone);
    },

    setState(value) {
      this.location.state = value;
    },

    setCountry(value) {
      this.location.country = value;
    },
  },

  computed: {
    ...mapGetters('app', ['userLogged']),

    entityName() {
      return 'location';
    },
    isNew() {
      return _.get(this, 'location._id.length', 0) === 0;
    },
    canCreate() {
      return hasRole(this.userLogged, 'LOCATION_CREATE_ALL');
    },
    canEdit() {
      return hasRole(this.userLogged, 'LOCATION_UPDATE_ALL');
    },
    canOnlyEdit() {
      return !this.isNew && this.canEdit;
    },
    canCreateOrEdit() {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    isValidName() {
      const locationName = _.get(this, 'location.name');
      return !_.isEmpty(locationName);
    },
    isValid() {
      return this.isValidName;
    },
    defaultCountryName() {
      return 'United States';
    },
    country() {
      return _.get(this, 'location.country');
    },
    state() {
      return _.get(this, 'location.state');
    },
  },
};
