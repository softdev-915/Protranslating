import _ from 'lodash';
import { mapGetters } from 'vuex';
import VendorMinimumChargeService from '../../../services/vendor-minimum-charge-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import { hasRole } from '../../../utils/user';
import AbilityService from '../../../services/ability-service';
import UserAjaxBasicSelect from '../../form/user-ajax-basic-select.vue';
import LanguageCombinationSelector from '../../language-combination-selector/index.vue';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';

const vendorMinimumChargeService = new VendorMinimumChargeService();
const abilityService = new AbilityService();

export default {
  mixins: [entityEditMixin],
  components: {
    LanguageCombinationSelector,
    UserAjaxBasicSelect,
    SimpleBasicSelect,
  },
  data() {
    return {
      abilities: null,
      vendorMinimumCharge: {
        _id: '',
        vendor: {
          _id: '',
          name: '',
        },
        ability: {
          _id: '',
          name: '',
        },
        languageCombinations: [],
        rate: 0,
      },
    };
  },
  created() {
    this.abilities = abilityService.retrieve();
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    entityName() {
      return 'vendorMinimumCharge';
    },
    canCreate: function () {
      return hasRole(this.userLogged, 'VENDOR-MIN-CHARGE_CREATE_ALL');
    },
    canCreateOrEdit: function () {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canEdit: function () {
      return hasRole(this.userLogged, 'VENDOR-MIN-CHARGE_UPDATE_ALL');
    },
    cancelText: function () {
      return this.canCreateOrEdit ? 'Cancel' : 'Exit';
    },
    showBreadcrumb: function () {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      return _.isEmpty(_.get(this, 'vendorMinimumCharge._id', ''));
    },
    isValid() {
      return [
        _.get(this, 'vendorMinimumCharge.vendor._id', ''),
      ].every((item) => !_.isEmpty(item) && !_.isNil(item))
      && this.isValidRate
      && this.isValidAbility
      && _.isEmpty(_.get(this, 'errors.items', []));
    },
    selectedVendor() {
      const firstName = _.get(this, 'vendorMinimumCharge.vendor.firstName', '');
      const lastName = _.get(this, 'vendorMinimumCharge.vendor.lastName', '');
      return {
        text: _.get(this, 'vendorMinimumCharge.vendor.name', `${firstName} ${lastName}`),
        value: _.get(this, 'vendorMinimumCharge.vendor._id'),
      };
    },
    isValidAbility() {
      return !_.isEmpty(_.get(this, 'vendorMinimumCharge.ability._id'));
    },
    isValidRate() {
      return this.vendorMinimumCharge.rate >= 0;
    },
  },
  methods: {
    _service() {
      return vendorMinimumChargeService;
    },
    _handleRetrieve(response) {
      this.vendorMinimumCharge = _.get(response, 'data.vendorMinimumCharge', {});
    },
    cloneRecord() {
      this.$router.push({
        path: this.$route.path.replace(/vendor-minimum-charge.*/, 'vendor-minimum-charge/create'),
      });
      Object.assign(this.vendorMinimumCharge, { _id: undefined, id: undefined });
      this.pushNotification({
        title: 'Success', message: 'Vendor minimum charge is cloned', state: 'success',
      });
    },
    _handleCreate(response) {
      this.vendorMinimumCharge._id = _.get(response, 'data.vendorMinimumCharge._id', '');
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'vendorMinimumCharge', freshEntity);
    },
    save() {
      if (this.isValid) {
        const vendorMinimumCharge = _.cloneDeep(this.vendorMinimumCharge);
        vendorMinimumCharge.vendor = _.get(this, 'vendorMinimumCharge.vendor._id', '');
        this._save(vendorMinimumCharge);
      }
    },
    cancel() {
      this.close();
    },
    onAbilitySelect(value) {
      if (_.isEmpty(value)) {
        return;
      }
      this.vendorMinimumCharge.ability = value;
    },
    onAbilityDelete() {
      this.vendorMinimumCharge.ability = {
        _id: '',
        name: '',
      };
    },
    formatAbilityOption({ _id, name }) {
      return {
        text: name,
        value: { _id, name },
      };
    },
    onSelectLanguageCombination(selectedOptions) {
      this.abilities.selectedOptions = selectedOptions;
    },
    onVendorSelect(vendor) {
      this.vendorMinimumCharge.vendor = {
        _id: vendor.value,
        name: vendor.text,
      };
    },
  },
};
