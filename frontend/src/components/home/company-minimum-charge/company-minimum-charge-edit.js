import _ from 'lodash';
import { mapGetters } from 'vuex';
import CompanyMinimumChargeService from '../../../services/company-minimum-charge-service';
import CompanyAjaxBasicSelect from '../company/company-ajax-basic-select.vue';
import LanguageCombinationSelector from '../../language-combination-selector/index.vue';
import { hasRole } from '../../../utils/user';
import { entityEditMixin } from '../../../mixins/entity-edit';
import AbilityService from '../../../services/ability-service';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import CurrencySelector from '../../currency-select/currency-selector.vue';

const abilityService = new AbilityService();
const service = new CompanyMinimumChargeService();
const buildInitialState = () => ({
  abilitySelected: {
    text: '',
    value: '',
  },
  abilities: [],
  companyMinimumCharge: {
    company: {
      _id: null,
      name: '',
      hierarchy: '',
    },
    deleted: false,
    ability: {
      _id: '',
      name: '',
    },
    languageCombinations: [],
    minCharge: 0,
    currency: {},
  },
});
export default {
  mixins: [entityEditMixin],
  components: {
    CompanyAjaxBasicSelect,
    LanguageCombinationSelector,
    SimpleBasicSelect,
    CurrencySelector,
  },
  data: () => buildInitialState(),
  created() {
    this.emptyAbilitySelectedOption = {
      text: '',
      value: {
        text: '',
        value: '',
      },
    };
    this.currencyFormatter = ({ isoCode, _id }) => ({ text: isoCode, value: { isoCode, _id } });
    this.retrieveAbilities();
  },
  methods: {
    _service() {
      return service;
    },
    _handleCreate(response) {
      this.companyMinimumCharge._id = response.data.companyMinimumCharge._id;
    },
    _handleRetrieve(response) {
      const { companyMinimumCharge } = response.data;
      this.abilitySelected = {
        text: _.get(companyMinimumCharge, 'ability.name', ''),
        value: _.get(companyMinimumCharge, 'ability._id', ''),
      };
      Object.assign(this.companyMinimumCharge, companyMinimumCharge);
    },
    _handleEditResponse({ data = {} }) {
      Object.assign(this.companyMinimumCharge, data.companyMinimumCharge);
    },
    retrieveAbilities() {
      abilityService.retrieve().then((response) => {
        const abilityList = _.get(response, 'data.list', []);
        this.abilities = abilityList.map((a) => ({ value: a._id, text: a.name }));
      });
    },
    validateBeforeSubmit() {
      this.$validator.validateAll().then((isValid) => {
        if (isValid) {
          this.save();
        }
      });
    },
    cloneRecord() {
      this.companyMinimumCharge._id = undefined;
      this.companyMinimumCharge.id = undefined;
      this.$emit('company-minimum-charge-creation-clone');
    },
    save() {
      const clone = _.cloneDeep(this.companyMinimumCharge);
      this._save(clone);
    },
    onSelectedCompany(company) {
      this.companyMinimumCharge.company = company;
    },
    onSelectedAbility(newValue) {
      this.companyMinimumCharge.ability = {
        _id: newValue.value,
        name: newValue.text,
      };
    },
    formatAbilitySelectedOption: (option) => ({
      text: _.get(option, 'text', ''),
      value: option,
    }),
  },
  computed: {
    ...mapGetters('app', ['userLogged', 'currencies']),
    entityName() {
      return 'companyMinimumCharge';
    },
    selectedCompany() {
      return {
        text: _.get(this.companyMinimumCharge, 'company.hierarchy', ''),
        value: _.get(this.companyMinimumCharge, 'company._id', ''),
      };
    },
    isNew() {
      return _.get(this, 'companyMinimumCharge._id.length', 0) === 0;
    },
    canCreate() {
      return hasRole(this.userLogged, 'COMPANY-MIN-CHARGE_CREATE_ALL');
    },
    canEdit() {
      return hasRole(this.userLogged, 'COMPANY-MIN-CHARGE_UPDATE_ALL');
    },
    canOnlyEdit() {
      return !this.isNew && this.canEdit;
    },
    canCreateOrEdit() {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    languageCombinations() {
      return _.get(this.companyMinimumCharge, 'languageCombinations', []).join(', ');
    },
    isValidMinCharge() {
      return _.isNumber(this.companyMinimumCharge.minCharge)
        && parseInt(this.companyMinimumCharge.minCharge, 10) > 0;
    },
    isValidCompany() {
      return !_.isEmpty(this.companyMinimumCharge.company._id);
    },
    isValidAbility() {
      return !_.isEmpty(_.get(this, 'abilitySelected.value', ''));
    },
    isValidCurrency() {
      const currency = this.currencies.find((c) => c._id === this.companyMinimumCharge.currency._id);
      return !_.isNil(currency);
    },
    isValid() {
      return this.isValidCompany && this.isValidAbility && this.isValidMinCharge
        && this.isValidCurrency;
    },
  },
};
