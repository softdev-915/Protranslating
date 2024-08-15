import _ from 'lodash';
import { mapGetters } from 'vuex';
import ExpenseAccountService from '../../../services/expense-account-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import { hasRole } from '../../../utils/user';

const expenseAccountService = new ExpenseAccountService();
const buildInitialState = () => ({
  selectedCostType: {
    text: 'Fixed',
    value: 'Fixed',
  },
  expenseAccount: {
    _id: '',
    number: '',
    deleted: false,
    costType: '',
    name: '',
  },
});

export default {
  mixins: [entityEditMixin],
  data() {
    return buildInitialState();
  },
  watch: {
    selectedCostType: {
      immediate: true,
      handler(newSelectedCostType) {
        this.expenseAccount.costType = newSelectedCostType.value;
      },
    },
  },
  created() {
    this.costTypeOptions = [{
      value: 'Fixed',
      text: 'Fixed',
    }, {
      value: 'Variable',
      text: 'Variable',
    }];
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    entityName() {
      return 'expenseAccount';
    },
    canCreate: function () {
      return hasRole(this.userLogged, 'EXPENSE-ACCOUNT_CREATE_ALL');
    },
    canCreateOrEdit: function () {
      return this.canEdit || (this.isNew && this.canCreate);
    },
    canEdit: function () {
      return hasRole(this.userLogged, 'EXPENSE-ACCOUNT_UPDATE_ALL');
    },
    cancelText: function () {
      return this.canCreateOrEdit ? 'Cancel' : 'Exit';
    },
    showBreadcrumb: function () {
      return this.navigationBreadcrumb.length > 1;
    },
    isNew() {
      return _.isEmpty(_.get(this, 'expenseAccount._id', ''));
    },
    isValid() {
      return _.isEmpty(_.get(this, 'errors.items', [])) && this.isValidCostType;
    },
    isValidCostType() {
      return !_.isEmpty(_.get(this, 'expenseAccount.costType', ''));
    },
  },
  methods: {
    _service() {
      return expenseAccountService;
    },
    _handleRetrieve(response) {
      this.expenseAccount = _.get(response, 'data.expenseAccount', {});
      const costType = _.get(this, 'expenseAccount.costType', '');
      this.selectedCostType = {
        text: costType,
        value: costType,
      };
    },
    _handleCreate(response) {
      this.expenseAccount._id = _.get(response, 'data.expenseAccount._id', '');
      this.$router.replace({
        name: 'expense-account-edition',
        params: {
          entityId: this.expenseAccount._id,
        },
      });
    },
    _refreshEntity(freshEntity) {
      this.$set(this, 'expenseAccount', freshEntity);
    },
    save() {
      if (this.isValid) {
        this._save(this.expenseAccount);
      }
    },
    cancel() {
      this.close();
    },
    onCostTypeSelect(selectedCostType) {
      this.selectedCostType = selectedCostType;
    },
  },
};
