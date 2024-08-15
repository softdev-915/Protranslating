import _ from 'lodash';
import { mapGetters } from 'vuex';
import AbilitySelector from '../../ability-select/ability-selector.vue';
import AbilityExpenseAccountService from '../../../services/ability-expense-account-service';
import ExpenseAccountService from '../../../services/expense-account-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import { hasRole } from '../../../utils/user';

const abilityExpenseAccountService = new AbilityExpenseAccountService();
const expenseAccountService = new ExpenseAccountService();
const buildInitialState = () => ({
  selectedExpenseAccount: {
    text: '',
    value: '',
  },
  selectedAbility: {
    text: '',
    value: '',
  },
  abilityExpenseAccount: {
    _id: '',
    expenseAccount: '',
    deleted: false,
    ability: '',
  },
  expenseAccountOptions: [],
});

export default {
  components: {
    AbilitySelector,
  },
  mixins: [entityEditMixin],
  data() {
    return buildInitialState();
  },
  created() {
    expenseAccountService.get().then((res) => {
      this.expenseAccountOptions = _.map(_.get(res, 'data.list'), (expenseAccount) => ({
        text: `${expenseAccount.number} - ${expenseAccount.costType}`,
        value: expenseAccount._id,
      }));
    });
  },
  watch: {
    selectedExpenseAccount: {
      immediate: true,
      handler(newSelectedExpenseAccount) {
        this.abilityExpenseAccount.expenseAccount = newSelectedExpenseAccount.value;
      },
    },
    selectedAbility(selectedAbility) {
      this.abilityExpenseAccount.ability = selectedAbility._id;
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    entityName() {
      return 'abilityExpenseAccount';
    },
    canCreate() {
      return hasRole(this.userLogged, 'EXPENSE-ACCOUNT_CREATE_ALL');
    },
    canCreateOrEdit() {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canEdit() {
      return hasRole(this.userLogged, 'EXPENSE-ACCOUNT_UPDATE_ALL');
    },
    showBreadcrumb() {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      return _.isEmpty(_.get(this, 'abilityExpenseAccount._id', ''));
    },
    isValid() {
      return this.isValidExpenseAccount && this.isValidAbility;
    },
    isValidExpenseAccount() {
      return !_.isEmpty(_.get(this, 'abilityExpenseAccount.expenseAccount', ''));
    },
    isValidAbility() {
      return !_.isEmpty(_.get(this, 'abilityExpenseAccount.ability', ''));
    },
  },
  methods: {
    _service() {
      return abilityExpenseAccountService;
    },
    _handleRetrieve(response) {
      this.abilityExpenseAccount = _.get(response, 'data.abilityExpenseAccount', {});
      const expenseAccount = _.get(this, 'abilityExpenseAccount.expenseAccount', '');
      const ability = _.get(this, 'abilityExpenseAccount.ability', {});
      this.selectedAbility = _.assign(this.selectedAbility, {
        text: ability.name,
        value: ability._id,
      });
      this.selectedExpenseAccount = {
        text: expenseAccount.name,
        value: expenseAccount._id,
      };
      _.set(this, 'abilityExpenseAccount.expenseAccount', expenseAccount._id);
      _.set(this, 'abilityExpenseAccount.ability', ability._id);
    },
    _handleCreate(response) {
      this.abilityExpenseAccount._id = _.get(response, 'data.abilityExpenseAccount._id', '');
      this.$router.replace({
        name: 'ability-expense-account-edition',
        params: {
          entityId: this.abilityExpenseAccount._id,
        },
      });
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'abilityExpenseAccount', freshEntity);
    },
    save() {
      if (this.isValid) {
        this._save(this.abilityExpenseAccount);
      }
    },
    cancel() {
      this.close();
    },
    onExpenseAccountSelect(selectedExpenseAccount) {
      this.selectedExpenseAccount = selectedExpenseAccount;
    },
    isFieldValid(fieldName) {
      const errorIndex = _.findIndex(
        this.entityValidationErrors, (errorObj) => !_.isNil(errorObj.props[fieldName]),
      );
      return errorIndex === -1;
    },
  },
};
