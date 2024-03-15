import _ from 'lodash';
import { entityEditMixin } from '../../../../mixins/entity-edit';
import roleCheckMixin from '../../../../mixins/user-role-check';
import AbilityService from '../../../../services/ability-service';
import RevenueAccountService from '../../../../services/revenue-account-service';
import SimpleBasicSelect from '../../../form/simple-basic-select.vue';

const abilityService = new AbilityService();
const revenueAccountService = new RevenueAccountService();
const buildInitialState = () => ({
  ability: {
    _id: '',
    name: '',
    description: '',
    glAccountNo: '',
    languageCombination: false,
    internalDepartmentRequired: false,
    companyRequired: false,
    catTool: false,
    competenceLevelRequired: false,
    deleted: false,
    readDate: null,
  },
  revenueAccountsPromise: null,
});
export default {
  components: {
    SimpleBasicSelect,
  },
  mixins: [entityEditMixin, roleCheckMixin],
  data() {
    return buildInitialState();
  },
  created() {
    this.fetchRevenueAccounts();
  },
  computed: {
    entityName() {
      return 'ability';
    },
    canCreate() {
      return this.hasRole('USER_CREATE_ALL');
    },
    canEdit() {
      return this.hasRole({ oneOf: ['USER_UPDATE_ALL', 'ABILITY_UPDATE_ALL'] });
    },
    isNew() {
      return _.isEmpty(_.get(this, 'ability._id', ''));
    },
    isValidName() {
      return this.ability.name.length !== 0;
    },
    isValidGlAccountNo() {
      return this.ability.glAccountNo.length === 5;
    },
    isValid() {
      return this.isValidName && this.isValidGlAccountNo;
    },
    canCreateOrEdit() {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canOnlyEdit() {
      return this.isNew !== '' && this.canEdit;
    },
    system() {
      return this.isNew || _.isNil(this.ability.system) ? false : this.ability.system;
    },
  },
  methods: {
    _service() {
      return abilityService;
    },
    _handleRetrieve(response) {
      Object.assign(this.ability, response.data.ability);
    },
    _handleEditResponse(response) {
      const newReadDate = _.get(response, 'data.ability.readDate');
      if (newReadDate) {
        this.ability.readDate = newReadDate;
      }
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'ability', freshEntity);
    },
    _handleCreate(response) {
      this.ability._id = response.data.ability._id;
    },
    save() {
      this.$validator.validateAll().then((isValid) => {
        if (isValid) {
          this._save(this.ability);
        }
      });
    },
    formatRevenueAccountItem(item) {
      let value;
      const text = value = _.get(item, 'no', '');
      return { text, value };
    },
    fetchRevenueAccounts() {
      const params = { filter: { deletedText: 'false' } };
      this.revenueAccountsPromise = revenueAccountService.retrieve(params);
    },
  },
};
